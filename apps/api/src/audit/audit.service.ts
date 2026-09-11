import { Injectable } from '@nestjs/common';
import type { AuditAction, AuditEvent } from '@annex21/shared';
import { auditEvents } from '../common/in-memory.store';

/**
 * Journal append-only. Pas d'update / delete métier.
 * Ne jamais exposer via /public/trust (RG-07).
 */
@Injectable()
export class AuditService {
  append(input: {
    orgId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    actorUserId?: string;
    payload?: Record<string, unknown>;
  }): AuditEvent {
    const event: AuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };
    auditEvents.push(event);
    return event;
  }

  list(orgId?: string, limit = 100): AuditEvent[] {
    const rows = orgId
      ? auditEvents.filter((e) => e.orgId === orgId)
      : [...auditEvents];
    return rows
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}
