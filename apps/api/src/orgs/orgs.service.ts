import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Organization } from '@annex21/shared';
import { organizations } from '../common/in-memory.store';
import { CreateOrgDto } from './dto/create-org.dto';
import { PgService } from '../db/pg.service';

export type CompleteOrgOnboardingInput = {
  orgName: string;
  nis2Sector: string;
  cisoRole: 'ciso' | 'contributor' | 'viewer';
  country?: 'FR' | 'DE' | 'AT' | 'CH';
  /** Prefer updating this org when provided (session.orgId / default). */
  orgId?: string | null;
};

@Injectable()
export class OrgsService {
  constructor(private readonly pg: PgService) {}

  list(): Organization[] {
    return organizations;
  }

  getById(id: string): Organization | undefined {
    return organizations.find((o) => o.id === id);
  }

  getBySlug(slug: string): Organization {
    const org = organizations.find((o) => o.slug === slug);
    if (!org) throw new NotFoundException(`Organisation ${slug} introuvable`);
    return org;
  }

  create(dto: CreateOrgDto): Organization {
    if (organizations.some((o) => o.slug === dto.slug)) {
      throw new ConflictException(`Slug ${dto.slug} déjà pris`);
    }
    const org: Organization = {
      id: `org_${Date.now()}`,
      slug: dto.slug,
      name: dto.name,
      country: dto.country,
      createdAt: new Date().toISOString(),
      nis2Sector: null,
      cisoRole: null,
      onboardingCompletedAt: null,
    };
    organizations.push(org);
    void this.persistOrg(org);
    return org;
  }

  /**
   * Persist Étape 1/2 fields and set orgs.onboarding_completed_at (Architecte GO).
   * Memory + Postgres upsert.
   */
  async completeOnboarding(input: CompleteOrgOnboardingInput): Promise<Organization> {
    const name = input.orgName.trim();
    const completedAt = new Date().toISOString();
    const slug = this.slugify(name);

    let org =
      (input.orgId ? this.getById(input.orgId) : undefined) ??
      organizations.find((o) => o.slug === slug) ??
      organizations.find((o) => o.id === 'org_acme');

    if (!org) {
      org = {
        id: `org_${Date.now()}`,
        slug,
        name,
        country: input.country ?? 'FR',
        createdAt: completedAt,
        nis2Sector: input.nis2Sector.trim(),
        cisoRole: input.cisoRole,
        onboardingCompletedAt: completedAt,
      };
      organizations.push(org);
    } else {
      org.name = name;
      if (!organizations.some((o) => o.slug === slug && o.id !== org!.id)) {
        org.slug = slug;
      }
      org.nis2Sector = input.nis2Sector.trim();
      org.cisoRole = input.cisoRole;
      org.onboardingCompletedAt = completedAt;
      if (input.country) org.country = input.country;
    }

    await this.persistOrg(org);
    return org;
  }

  /** True if the given org (or any org if id omitted) has completed onboarding. */
  isOnboardingComplete(orgId?: string | null): boolean {
    if (orgId) {
      return Boolean(this.getById(orgId)?.onboardingCompletedAt);
    }
    return organizations.some((o) => Boolean(o.onboardingCompletedAt));
  }

  async findCompletedForHydration(
    orgId?: string | null,
  ): Promise<Organization | null> {
    if (orgId) {
      const byId = this.getById(orgId);
      if (byId?.onboardingCompletedAt) return byId;
    }

    const mem = organizations.find((o) => Boolean(o.onboardingCompletedAt));
    if (mem) return mem;

    if (this.pg.isPostgres()) {
      try {
        const res = await this.pg.query<{
          id: string;
          slug: string;
          name: string;
          country: 'FR' | 'DE' | 'AT' | 'CH';
          nis2_sector: string | null;
          ciso_role: 'ciso' | 'contributor' | 'viewer' | null;
          onboarding_completed_at: Date | null;
          created_at: Date;
        }>(
          orgId
            ? `SELECT id, slug, name, country, nis2_sector, ciso_role,
                      onboarding_completed_at, created_at
               FROM orgs WHERE id = $1 AND onboarding_completed_at IS NOT NULL`
            : `SELECT id, slug, name, country, nis2_sector, ciso_role,
                      onboarding_completed_at, created_at
               FROM orgs WHERE onboarding_completed_at IS NOT NULL
               ORDER BY onboarding_completed_at DESC LIMIT 1`,
          orgId ? [orgId] : [],
        );
        const row = res.rows[0];
        if (!row) return null;
        const mapped = this.mapRow(row);
        this.mergeIntoMemory(mapped);
        return mapped;
      } catch {
        return null;
      }
    }
    return null;
  }

  private slugify(name: string): string {
    const base = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
    return base || `org-${Date.now()}`;
  }

  private async persistOrg(org: Organization): Promise<void> {
    if (!this.pg.isPostgres()) return;
    try {
      await this.pg.query(
        `INSERT INTO orgs
           (id, slug, name, country, nis2_sector, ciso_role,
            onboarding_completed_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8::timestamptz,NOW())
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           name = EXCLUDED.name,
           country = EXCLUDED.country,
           nis2_sector = EXCLUDED.nis2_sector,
           ciso_role = EXCLUDED.ciso_role,
           onboarding_completed_at = EXCLUDED.onboarding_completed_at,
           updated_at = NOW()`,
        [
          org.id,
          org.slug,
          org.name,
          org.country,
          org.nis2Sector ?? null,
          org.cisoRole ?? null,
          org.onboardingCompletedAt ?? null,
          org.createdAt,
        ],
      );
    } catch {
      /* Postgres optional in dev memory mode */
    }
  }

  private mapRow(row: {
    id: string;
    slug: string;
    name: string;
    country: 'FR' | 'DE' | 'AT' | 'CH';
    nis2_sector: string | null;
    ciso_role: 'ciso' | 'contributor' | 'viewer' | null;
    onboarding_completed_at: Date | null;
    created_at: Date;
  }): Organization {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      country: row.country,
      createdAt: new Date(row.created_at).toISOString(),
      nis2Sector: row.nis2_sector,
      cisoRole: row.ciso_role,
      onboardingCompletedAt: row.onboarding_completed_at
        ? new Date(row.onboarding_completed_at).toISOString()
        : null,
    };
  }

  private mergeIntoMemory(org: Organization): void {
    const idx = organizations.findIndex((o) => o.id === org.id);
    if (idx >= 0) {
      organizations[idx] = { ...organizations[idx], ...org };
    } else {
      organizations.push(org);
    }
  }
}
