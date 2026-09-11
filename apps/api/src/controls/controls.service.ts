import { Injectable, NotFoundException } from '@nestjs/common';
import type { Control } from '@annex21/shared';
import { controls } from '../common/in-memory.store';
import { AuditService } from '../audit/audit.service';
import { UpdateControlDto } from './dto/update-control.dto';

@Injectable()
export class ControlsService {
  constructor(private readonly audit: AuditService) {}

  list(orgId?: string): Control[] {
    if (!orgId) return [...controls];
    return controls.filter((c) => c.orgId === orgId);
  }

  getById(id: string): Control {
    const row = controls.find((c) => c.id === id);
    if (!row) throw new NotFoundException(`Contrôle ${id} introuvable`);
    return row;
  }

  update(id: string, dto: UpdateControlDto, actorUserId?: string): Control {
    const row = this.getById(id);
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.owner !== undefined) row.owner = dto.owner;
    if (dto.dueAt !== undefined) row.dueAt = dto.dueAt;
    row.updatedAt = new Date().toISOString();
    this.audit.append({
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
