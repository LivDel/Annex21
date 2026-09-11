import { Injectable, NotFoundException } from '@nestjs/common';
import type { PlaybookTemplate } from '@annex21/shared';
import { playbookTemplates } from '../common/in-memory.store';

/**
 * Templates FR-ANSSI immutables.
 * Lecture seule — pas d'update du body (nouvelle version = seed / migration).
 */
@Injectable()
export class PlaybooksService {
  listTemplates(): PlaybookTemplate[] {
    return playbookTemplates.map((t) => ({
      ...t,
      body: structuredClone(t.body),
    }));
  }

  getTemplate(id: string): PlaybookTemplate {
    const row = playbookTemplates.find((t) => t.id === id);
    if (!row) throw new NotFoundException(`Playbook template ${id} introuvable`);
    return { ...row, body: structuredClone(row.body) };
  }
}
