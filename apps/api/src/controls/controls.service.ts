import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Control } from '@annex21/shared';
import { DOMAIN_STORE, type DomainStore } from '../store/domain-store';
import { AuditService } from '../audit/audit.service';
import { UpdateControlDto } from './dto/update-control.dto';

@Injectable()
export class ControlsService {
  constructor(
    @Inject(DOMAIN_STORE) private readonly store: DomainStore,
    private readonly audit: AuditService,
  ) {}

  list(orgId?: string): Promise<Control[]> {
    return this.store.listControls(orgId);
  }

  async getById(id: string): Promise<Control> {
    const row = await this.store.getControl(id);
    if (!row) throw new NotFoundException(`Contrôle ${id} introuvable`);
    return row;
  }

  async update(
    id: string,
    dto: UpdateControlDto,
    actorUserId?: string,
  ): Promise<Control> {
    const row = await this.store.updateControl(id, {
      status: dto.status,
      owner: dto.owner,
      dueAt: dto.dueAt,
    });
    if (!row) throw new NotFoundException(`Contrôle ${id} introuvable`);
    await this.audit.append({
      orgId: row.orgId,
      action: 'control.updated',
      entityType: 'control',
      entityId: row.id,
      actorUserId,
      payload: { status: row.status, owner: row.owner },
    });
    return row;
  }
}
