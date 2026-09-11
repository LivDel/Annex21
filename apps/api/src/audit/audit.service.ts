import { Inject, Injectable } from '@nestjs/common';
import type { AuditAction, AuditEvent } from '@annex21/shared';
import { DOMAIN_STORE, type DomainStore } from '../store/domain-store';

/**
 * Journal append-only. Pas d'update / delete métier.
 * Ne jamais exposer via /public/trust (RG-07).
 * Persisté Postgres si disponible, sinon mémoire (dev).
 */
@Injectable()
export class AuditService {
  constructor(@Inject(DOMAIN_STORE) private readonly store: DomainStore) {}

  async append(input: {
    orgId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    actorUserId?: string;
    payload?: Record<string, unknown>;
  }): Promise<AuditEvent> {
    return this.store.appendAudit(input);
  }

  async list(orgId?: string, limit = 100): Promise<AuditEvent[]> {
    return this.store.listAudit(orgId, limit);
  }
}
