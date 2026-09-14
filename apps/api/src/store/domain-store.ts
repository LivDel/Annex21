import type {
  AuditAction,
  AuditEvent,
  BillingStatus,
  Control,
  ControlStatus,
  Incident,
  IncidentStep,
  Nis2Assessment,
  OrgBilling,
  PlaybookTemplate,
  AssessmentAnswers,
  AssessmentGap,
  ScopeStatus,
  Nis2Domain,
  TrustCenterView,
  TrustDraftPatch,
  OrgIdentityProvider,
  OrgMember,
  OrgMemberRole,
  IdpStatus,
  SsoProtocol,
  SsoProviderKind,
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
 * Thin repository for assessment / controls / playbooks / incidents / trust / audit / billing.
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

  /** Stripe ACV billing on org/tenant (Postgres orgs + memory fallback). */
  getBilling(orgId: string): Promise<OrgBilling | null>;
  upsertBilling(
    orgId: string,
    patch: {
      status?: BillingStatus;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
    },
  ): Promise<OrgBilling>;
  findOrgIdByStripeCustomer(customerId: string): Promise<string | null>;
  /** Returns true if newly claimed (process); false if already processed (idempotent). */
  claimWebhookEvent(eventId: string, eventType: string, orgId?: string | null): Promise<boolean>;

  // --- SSO V1: IdP + org members ---
  getIdp(orgId: string): Promise<OrgIdentityProvider | null>;
  getIdpById(idpId: string): Promise<(OrgIdentityProvider & { clientSecretEnc?: string | null; metadataXml?: string | null }) | null>;
  listConnectedIdps(): Promise<OrgIdentityProvider[]>;
  upsertIdp(
    orgId: string,
    input: {
      id?: string;
      protocol: SsoProtocol;
      provider: SsoProviderKind;
      displayName: string;
      issuer?: string | null;
      clientId?: string | null;
      clientSecretEnc?: string | null;
      metadataUrl?: string | null;
      metadataXml?: string | null;
      spEntityId?: string | null;
      acsUrl?: string | null;
      domains?: string[];
      status?: IdpStatus;
      lastError?: string | null;
    },
  ): Promise<OrgIdentityProvider>;
  updateIdpStatus(
    idpId: string,
    patch: {
      status: IdpStatus;
      lastError?: string | null;
      testedAt?: string | null;
      connectedAt?: string | null;
    },
  ): Promise<OrgIdentityProvider | null>;
  revokeIdp(idpId: string): Promise<OrgIdentityProvider | null>;

  listMembers(orgId: string): Promise<OrgMember[]>;
  getMemberByEmail(orgId: string, email: string): Promise<OrgMember | null>;
  upsertMember(input: {
    orgId: string;
    userId: string;
    email: string;
    displayName?: string | null;
    role?: OrgMemberRole;
    pendingAssignment?: boolean;
    idpSubject?: string | null;
    idpId?: string | null;
  }): Promise<OrgMember>;
  updateMemberRole(
    orgId: string,
    memberId: string,
    role: OrgMemberRole,
  ): Promise<OrgMember | null>;
}

export type { IncidentStep };
