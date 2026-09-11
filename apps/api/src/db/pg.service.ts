import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { resolveDatabaseUrl } from './resolve-database-url';
import { runAssessmentMigrations } from './migrate';
import {
  assessments as seedAssessments,
  auditEvents as seedAudit,
  controls as seedControls,
  incidents as seedIncidents,
  organizations as seedOrgs,
  playbookTemplates as seedPlaybooks,
  trustCenters as seedTrust,
} from '../common/in-memory.store';

export type StoreBackend = 'postgres' | 'memory';

/**
 * Thin pg pool. Connects when DATABASE_URL / POSTGRES_* present.
 * Falls back to memory in non-production if DB unreachable — clearly logged.
 */
@Injectable()
export class PgService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgService.name);
  private pool: Pool | null = null;
  private backend: StoreBackend = 'memory';

  getBackend(): StoreBackend {
    return this.backend;
  }

  isPostgres(): boolean {
    return this.backend === 'postgres' && this.pool !== null;
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Postgres pool indisponible (backend memory)');
    }
    return this.pool;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.getPool().query<T>(text, params);
  }

  async onModuleInit(): Promise<void> {
    const url = resolveDatabaseUrl();
    const isProd = (process.env.NODE_ENV ?? 'development') === 'production';

    if (!url) {
      this.backend = 'memory';
      this.logger.warn(
        '⚠️  Aucun DATABASE_URL / POSTGRES_* — store assessments/controls/playbooks/incidents/trust/audit IN-MEMORY (dev). ' +
          'Données perdues au redémarrage. Démarrer infra/docker-compose.yml + configurer Postgres EU (RG-10).',
      );
      return;
    }

    const pool = new Pool({
      connectionString: url,
      max: 5,
      connectionTimeoutMillis: 3000,
      // RG-10: caller must point to EU Postgres only
    });

    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }

      this.pool = pool;
      this.backend = 'postgres';
      const migrationPath = await runAssessmentMigrations(pool);
      this.logger.log(
        `Postgres connecté (data residency EU). Migration appliquée: ${migrationPath}`,
      );
      await this.seedIfEmpty();
    } catch (err) {
      await pool.end().catch(() => undefined);
      this.pool = null;
      if (isProd) {
        throw new Error(
          `Postgres requis en production (RG-10). Connexion échouée: ${String(err)}`,
        );
      }
      this.backend = 'memory';
      this.logger.warn(
        `⚠️  Postgres indisponible (${String(err)}) — fallback IN-MEMORY pour assessments/controls/playbooks/incidents/trust/audit (development only). ` +
          'Préférer docker compose -f infra/docker-compose.yml up -d puis migrate.',
      );
      // Keep seed arrays as-is for memory mode
      void seedAssessments;
      void seedAudit;
      void seedIncidents;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end().catch(() => undefined);
      this.pool = null;
    }
  }

  /** Seed playbook templates + controls from in-memory fixtures if tables empty. */
  private async seedIfEmpty(): Promise<void> {
    if (!this.pool) return;

    const orgsCount = await this.pool.query<{ c: string }>(
      'SELECT COUNT(*)::text AS c FROM orgs',
    );
    if (Number(orgsCount.rows[0]?.c ?? 0) === 0) {
      for (const o of seedOrgs) {
        await this.pool.query(
          `INSERT INTO orgs
             (id, slug, name, country, nis2_sector, ciso_role,
              onboarding_completed_at, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8::timestamptz,NOW())
           ON CONFLICT (id) DO NOTHING`,
          [
            o.id,
            o.slug,
            o.name,
            o.country,
            o.nis2Sector ?? null,
            o.cisoRole ?? null,
            o.onboardingCompletedAt ?? null,
            o.createdAt,
          ],
        );
      }
      this.logger.log(`Seed orgs: ${seedOrgs.length} row(s)`);
    }

    const pb = await this.pool.query<{ c: string }>(
      'SELECT COUNT(*)::text AS c FROM playbook_templates',
    );
    if (Number(pb.rows[0]?.c ?? 0) === 0) {
      for (const t of seedPlaybooks) {
        await this.pool.query(
          `INSERT INTO playbook_templates (id, version, name, body, created_at)
           VALUES ($1, $2, $3, $4::jsonb, $5)
           ON CONFLICT (id) DO NOTHING`,
          [t.id, t.version, t.name, JSON.stringify(t.body), t.createdAt],
        );
      }
      this.logger.log(`Seed playbook_templates: ${seedPlaybooks.length} row(s)`);
    }

    const ctrl = await this.pool.query<{ c: string }>(
      'SELECT COUNT(*)::text AS c FROM controls',
    );
    if (Number(ctrl.rows[0]?.c ?? 0) === 0) {
      for (const c of seedControls) {
        await this.pool.query(
          `INSERT INTO controls (id, org_id, code, domain, title, status, owner, due_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [
            c.id,
            c.orgId,
            c.code,
            c.domain,
            c.title,
            c.status,
            c.owner ?? null,
            c.dueAt ?? null,
            c.updatedAt,
          ],
        );
      }
      this.logger.log(`Seed controls: ${seedControls.length} row(s)`);
    }

    const trust = await this.pool.query<{ c: string }>(
      'SELECT COUNT(*)::text AS c FROM trust_centers',
    );
    if (Number(trust.rows[0]?.c ?? 0) === 0) {
      for (const t of seedTrust) {
        await this.pool.query(
          `INSERT INTO trust_centers
            (org_id, org_slug, org_name, org_country, status, locale, controls, attestations, disclaimer_ack, unpublished_notes, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11)
           ON CONFLICT (org_id) DO NOTHING`,
          [
            t.orgId,
            t.org.slug,
            t.org.name,
            t.org.country,
            t.status,
            t.locale,
            JSON.stringify(t.controls ?? []),
            JSON.stringify(t.attestations ?? []),
            t.disclaimerAck,
            t.unpublishedNotes ?? null,
            t.updatedAt ?? new Date().toISOString(),
          ],
        );
      }
      this.logger.log(`Seed trust_centers: ${seedTrust.length} row(s)`);
    }
  }
}
