/** Audit trail append-only — pas d'UPDATE / delete métier. */

export type AuditAction =
  | 'assessment.created'
  | 'assessment.updated'
  | 'assessment.completed'
  | 'control.updated'
  | 'incident.opened'
  | 'incident.step.completed'
  | 'incident.step.evidence_linked'
  | 'incident.closed'
  | 'trust.draft.updated'
  | 'trust.published'
  | 'trust.unpublished';

export interface AuditEvent {
  id: string;
  orgId: string;
  actorUserId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}
