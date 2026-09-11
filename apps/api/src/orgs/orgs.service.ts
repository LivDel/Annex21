import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Organization } from '@annex21/shared';
import { organizations } from '../common/in-memory.store';
import { CreateOrgDto } from './dto/create-org.dto';

@Injectable()
export class OrgsService {
  list(): Organization[] {
    return organizations;
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
    };
    organizations.push(org);
    return org;
  }
}
