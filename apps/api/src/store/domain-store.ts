import type {
  AuditAction,
  AuditEvent,
  Control,
  ControlStatus,
  Incident,
  IncidentStep,
  Nis2Assessment,
  PlaybookTemplate,
  AssessmentAnswers,
  AssessmentGap,
  ScopeStatus,
  Nis2Domain,
  TrustCenterView,
  TrustDraftPatch,
} from '@annex21/shared';

export const DOMAIN_STORE = Symbol('DOMAIN_STORE');

export type StoreMode = 'postgres' | 'memory';

export interface AppendAuditInput {
  orgId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorUserId?: string;
  payload?: Record<string, unknown>;
}

export interface CreateAssessmentInput {
  orgId: string;
  answers?: AssessmentAnswers;
}

export interface UpdateAssessmentInput {
  answers?: AssessmentAnswers;
}

export interface CompleteAssessmentFields {
  domainScores: Partial<Record<Nis2Domain, number>>;
  maturityScore: number;
  scopeStatus: ScopeStatus;
  gaps: AssessmentGap[];
}

export interface UpdateControlInput {
  status?: ControlStatus;
  owner?: string;
  dueAt?: string;
}

/**
 * Thin repository for assessment / controls / playbooks / incidents / trust / audit.
 * Postgres when available; in-memory fallback for local/dev.
 * Trust drafts never leak to public routes (RG-07) — filtering is service-layer.
 */
export interface DomainStore {
  readonly mode: StoreMode;

  listAssessments(orgId?: string): Promise<Nis2Assessment[]>;
  getAssessment(id: string): Promise<Nis2Assessment | null>;
  createAssessment(input: CreateAssessmentInput): Promise<Nis2Assessment>;
  saveAssessment(row: Nis2Assessment): Promise<Nis2Assessment>;

  listControls(orgId?: string): Promise<Control[]>;
  getControl(id: string): Promise<Control | null>;
  updateControl(id: string, patch: UpdateControlInput): Promise<Control | null>;

  listPlaybookTemplates(): Promise<PlaybookTemplate[]>;
  getPlaybookTemplate(id: string): Promise<PlaybookTemplate | null>;

  listIncidents(orgId?: string): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident | null>;
  createIncident(row: Incident): Promise<Incident>;
  saveIncident(row: Incident): Promise<Incident>;

  getTrustBySlug(orgSlug: string): Promise<TrustCenterView | null>;
  saveTrust(row: TrustCenterView): Promise<TrustCenterView>;
  patchTrustDraft(
    orgSlug: string,
    patch: TrustDraftPatch,
  ): Promise<TrustCenterView | null>;

  appendAudit(input: AppendAuditInput): Promise<AuditEvent>;
  listAudit(orgId?: string, limit?: number): Promise<AuditEvent[]>;
}

export type { IncidentStep };
