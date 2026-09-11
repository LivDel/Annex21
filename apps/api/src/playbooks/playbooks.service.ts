import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PlaybookTemplate } from '@annex21/shared';
import { DOMAIN_STORE, type DomainStore } from '../store/domain-store';

/**
 * Templates FR-ANSSI immutables.
 * Lecture seule — pas d'update du body (nouvelle version = seed / migration).
 */
@Injectable()
export class PlaybooksService {
  constructor(@Inject(DOMAIN_STORE) private readonly store: DomainStore) {}

  listTemplates(): Promise<PlaybookTemplate[]> {
    return this.store.listPlaybookTemplates();
  }

  async getTemplate(id: string): Promise<PlaybookTemplate> {
    const row = await this.store.getPlaybookTemplate(id);
    if (!row) throw new NotFoundException(`Playbook template ${id} introuvable`);
    return row;
  }
}
