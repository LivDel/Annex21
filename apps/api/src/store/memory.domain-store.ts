import type {
  AuditEvent,
  BillingStatus,
  Control,
  IdpStatus,
  Incident,
  Nis2Assessment,
  OrgBilling,
  OrgIdentityProvider,
  OrgMember,
  OrgMemberRole,
  PlaybookTemplate,
  SsoProtocol,
  SsoProviderKind,
  TrustCenterView,
  TrustDraftPatch,
} from '@annex21/shared';
import {
  assessments,
  auditEvents,
  controls,
  incidents,
  playbookTemplates,
  trustCenters,
} from '../common/in-memory.store';

/** Dev-memory billing + webhook idempotency (Stripe ACV — no real keys required). */
const billingByOrg = new Map<string, OrgBilling>();
const claimedWebhookEvents = new Set<string>();

type IdpInternal = OrgIdentityProvider & {
  clientSecretEnc?: string | null;
  metadataXml?: string | null;
};
const idpsByOrg = new Map<string, IdpInternal>();
const idpsById = new Map<string, IdpInternal>();
const membersByOrg = new Map<string, OrgMember[]>();

import type {
  AppendAuditInput,
  CreateAssessmentInput,
  DomainStore,
  UpdateControlInput,
} from './domain-store';

export class MemoryDomainStore implements DomainStore {
  readonly mode = 'memory' as const;

  async listAssessments(orgId?: string): Promise<Nis2Assessment[]> {
    const rows = orgId
      ? assessments.filter((a) => a.orgId === orgId)
      : [...assessments];
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getAssessment(id: string): Promise<Nis2Assessment | null> {
    return assessments.find((a) => a.id === id) ?? null;
  }

  async createAssessment(input: CreateAssessmentInput): Promise<Nis2Assessment> {
    const ts = new Date().toISOString();
    const row: Nis2Assessment = {
      id: `asmt_${Date.now()}`,
      orgId: input.orgId,
      status: 'draft',
      answers: input.answers ?? {},
      disclaimerAck: false,
      version: 1,
      createdAt: ts,
      updatedAt: ts,
    };
    assessments.push(row);
    return row;
  }

  async saveAssessment(row: Nis2Assessment): Promise<Nis2Assessment> {
    const idx = assessments.findIndex((a) => a.id === row.id);
    if (idx >= 0) assessments[idx] = row;
    else assessments.push(row);
    return row;
  }

  async listControls(orgId?: string): Promise<Control[]> {
    if (!orgId) return [...controls];
    return controls.filter((c) => c.orgId === orgId);
  }

  async getControl(id: string): Promise<Control | null> {
    return controls.find((c) => c.id === id) ?? null;
  }

  async updateControl(
    id: string,
    patch: UpdateControlInput,
  ): Promise<Control | null> {
    const row = controls.find((c) => c.id === id);
    if (!row) return null;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.owner !== undefined) row.owner = patch.owner;
    if (patch.dueAt !== undefined) row.dueAt = patch.dueAt || undefined;
    row.updatedAt = new Date().toISOString();
    return row;
  }

  async listPlaybookTemplates(): Promise<PlaybookTemplate[]> {
    return playbookTemplates.map((t) => ({
      ...t,
      body: structuredClone(t.body),
    }));
  }

  async getPlaybookTemplate(id: string): Promise<PlaybookTemplate | null> {
    const row = playbookTemplates.find((t) => t.id === id);
    if (!row) return null;
    return { ...row, body: structuredClone(row.body) };
  }

  async listIncidents(orgId?: string): Promise<Incident[]> {
    const rows = orgId
      ? incidents.filter((i) => i.orgId === orgId)
      : [...incidents];
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getIncident(id: string): Promise<Incident | null> {
    return incidents.find((i) => i.id === id) ?? null;
  }

  async createIncident(row: Incident): Promise<Incident> {
    incidents.push(row);
    return row;
  }

  async saveIncident(row: Incident): Promise<Incident> {
    const idx = incidents.findIndex((i) => i.id === row.id);
    if (idx >= 0) incidents[idx] = row;
    else incidents.push(row);
    return row;
  }


  async getTrustBySlug(orgSlug: string): Promise<TrustCenterView | null> {
    const row = trustCenters.find((t) => t.org.slug === orgSlug);
    return row ? structuredClone(row) : null;
  }

  async saveTrust(row: TrustCenterView): Promise<TrustCenterView> {
    const idx = trustCenters.findIndex((t) => t.org.slug === row.org.slug);
    const next = { ...row, updatedAt: new Date().toISOString() };
    if (idx >= 0) trustCenters[idx] = next;
    else trustCenters.push(next);
    return structuredClone(next);
  }

  async patchTrustDraft(
    orgSlug: string,
    patch: TrustDraftPatch,
  ): Promise<TrustCenterView | null> {
    const row = trustCenters.find((t) => t.org.slug === orgSlug);
    if (!row) return null;
    if (patch.orgName !== undefined) row.org.name = patch.orgName;
    if (patch.country !== undefined) row.org.country = patch.country;
    if (patch.locale !== undefined) row.locale = patch.locale;
    if (patch.disclaimerAck !== undefined) row.disclaimerAck = patch.disclaimerAck;
    if (patch.unpublishedNotes !== undefined) {
      row.unpublishedNotes = patch.unpublishedNotes || undefined;
    }
    row.updatedAt = new Date().toISOString();
    return structuredClone(row);
  }

  async appendAudit(input: AppendAuditInput): Promise<AuditEvent> {
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

  async listAudit(orgId?: string, limit = 100): Promise<AuditEvent[]> {
    const rows = orgId
      ? auditEvents.filter((e) => e.orgId === orgId)
      : [...auditEvents];
    return rows
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async getBilling(orgId: string): Promise<OrgBilling | null> {
    const row = billingByOrg.get(orgId);
    return row ? structuredClone(row) : null;
  }

  async upsertBilling(
    orgId: string,
    patch: {
      status?: BillingStatus;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
    },
  ): Promise<OrgBilling> {
    const prev = billingByOrg.get(orgId);
    const stripeCustomerId =
      patch.stripeCustomerId !== undefined
        ? patch.stripeCustomerId
        : (prev?.stripeCustomerId ?? null);
    const stripeSubscriptionId =
      patch.stripeSubscriptionId !== undefined
        ? patch.stripeSubscriptionId
        : (prev?.stripeSubscriptionId ?? null);
    const next: OrgBilling = {
      orgId,
      status: patch.status ?? prev?.status ?? 'pending',
      stripeCustomerId,
      stripeSubscriptionId,
      hasSubscription: Boolean(stripeSubscriptionId),
      updatedAt: new Date().toISOString(),
    };
    billingByOrg.set(orgId, next);
    return structuredClone(next);
  }

  async findOrgIdByStripeCustomer(customerId: string): Promise<string | null> {
    for (const row of billingByOrg.values()) {
      if (row.stripeCustomerId === customerId) return row.orgId;
    }
    return null;
  }

  async claimWebhookEvent(
    eventId: string,
    _eventType: string,
    _orgId?: string | null,
  ): Promise<boolean> {
    if (claimedWebhookEvents.has(eventId)) return false;
    claimedWebhookEvents.add(eventId);
    return true;
  }

  private toPublicIdp(row: IdpInternal): OrgIdentityProvider {
    return {
      id: row.id,
      orgId: row.orgId,
      protocol: row.protocol,
      provider: row.provider,
      status: row.status,
      displayName: row.displayName,
      issuer: row.issuer ?? null,
      clientId: row.clientId ?? null,
      hasClientSecret: Boolean(row.clientSecretEnc),
      metadataUrl: row.metadataUrl ?? null,
      spEntityId: row.spEntityId ?? null,
      acsUrl: row.acsUrl ?? null,
      domains: row.domains ?? [],
      lastError: row.lastError ?? null,
      testedAt: row.testedAt ?? null,
      connectedAt: row.connectedAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async getIdp(orgId: string): Promise<OrgIdentityProvider | null> {
    const row = idpsByOrg.get(orgId);
    if (!row || row.status === 'revoked') return null;
    return this.toPublicIdp(row);
  }

  async getIdpById(
    idpId: string,
  ): Promise<
    | (OrgIdentityProvider & {
        clientSecretEnc?: string | null;
        metadataXml?: string | null;
      })
    | null
  > {
    const row = idpsById.get(idpId);
    if (!row) return null;
    return {
      ...this.toPublicIdp(row),
      clientSecretEnc: row.clientSecretEnc,
      metadataXml: row.metadataXml,
    };
  }

  async listConnectedIdps(): Promise<OrgIdentityProvider[]> {
    return [...idpsById.values()]
      .filter((r) => r.status === 'connected')
      .map((r) => this.toPublicIdp(r));
  }

  async upsertIdp(
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
  ): Promise<OrgIdentityProvider> {
    const existing = idpsByOrg.get(orgId);
    const now = new Date().toISOString();
    const id = input.id ?? existing?.id ?? `idp_${Date.now().toString(36)}`;
    if (existing && existing.id !== id && existing.status !== 'revoked') {
      existing.status = 'revoked';
      existing.updatedAt = now;
      idpsById.set(existing.id, existing);
    }
    const row: IdpInternal = {
      id,
      orgId,
      protocol: input.protocol,
      provider: input.provider,
      status: input.status ?? existing?.status ?? 'draft',
      displayName: input.displayName,
      issuer:
        input.issuer !== undefined ? input.issuer : (existing?.issuer ?? null),
      clientId:
        input.clientId !== undefined
          ? input.clientId
          : (existing?.clientId ?? null),
      hasClientSecret: false,
      clientSecretEnc:
        input.clientSecretEnc !== undefined
          ? input.clientSecretEnc
          : (existing?.clientSecretEnc ?? null),
      metadataUrl:
        input.metadataUrl !== undefined
          ? input.metadataUrl
          : (existing?.metadataUrl ?? null),
      metadataXml:
        input.metadataXml !== undefined
          ? input.metadataXml
          : (existing?.metadataXml ?? null),
      spEntityId:
        input.spEntityId !== undefined
          ? input.spEntityId
          : (existing?.spEntityId ?? null),
      acsUrl:
        input.acsUrl !== undefined ? input.acsUrl : (existing?.acsUrl ?? null),
      domains: input.domains ?? existing?.domains ?? [],
      lastError:
        input.lastError !== undefined
          ? input.lastError
          : (existing?.lastError ?? null),
      testedAt: existing?.testedAt ?? null,
      connectedAt: existing?.connectedAt ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    idpsByOrg.set(orgId, row);
    idpsById.set(id, row);
    return this.toPublicIdp(row);
  }

  async updateIdpStatus(
    idpId: string,
    patch: {
      status: IdpStatus;
      lastError?: string | null;
      testedAt?: string | null;
      connectedAt?: string | null;
    },
  ): Promise<OrgIdentityProvider | null> {
    const row = idpsById.get(idpId);
    if (!row) return null;
    row.status = patch.status;
    if (patch.lastError !== undefined) row.lastError = patch.lastError;
    if (patch.testedAt !== undefined) row.testedAt = patch.testedAt;
    if (patch.connectedAt !== undefined) row.connectedAt = patch.connectedAt;
    row.updatedAt = new Date().toISOString();
    idpsById.set(idpId, row);
    if (row.status !== 'revoked') idpsByOrg.set(row.orgId, row);
    return this.toPublicIdp(row);
  }

  async revokeIdp(idpId: string): Promise<OrgIdentityProvider | null> {
    return this.updateIdpStatus(idpId, { status: 'revoked', lastError: null });
  }

  async listMembers(orgId: string): Promise<OrgMember[]> {
    return structuredClone(membersByOrg.get(orgId) ?? []);
  }

  async getMemberByEmail(
    orgId: string,
    email: string,
  ): Promise<OrgMember | null> {
    const list = membersByOrg.get(orgId) ?? [];
    const found = list.find((m) => m.email === email.trim().toLowerCase());
    return found ? structuredClone(found) : null;
  }

  async upsertMember(input: {
    orgId: string;
    userId: string;
    email: string;
    displayName?: string | null;
    role?: OrgMemberRole;
    pendingAssignment?: boolean;
    idpSubject?: string | null;
    idpId?: string | null;
  }): Promise<OrgMember> {
    const email = input.email.trim().toLowerCase();
    const list = membersByOrg.get(input.orgId) ?? [];
    const existing =
      list.find((m) => m.email === email || m.userId === input.userId) ?? null;
    const now = new Date().toISOString();
    if (existing) {
      existing.userId = input.userId;
      existing.email = email;
      if (input.displayName !== undefined) {
        existing.displayName = input.displayName;
      }
      if (input.idpSubject !== undefined) existing.idpSubject = input.idpSubject;
      if (input.idpId !== undefined) existing.idpId = input.idpId;
      // NEVER elevate role on SSO re-login (zero JIT admin)
      existing.updatedAt = now;
      membersByOrg.set(input.orgId, list);
      return structuredClone(existing);
    }
    const row: OrgMember = {
      id: `mem_${Date.now().toString(36)}`,
      orgId: input.orgId,
      userId: input.userId,
      email,
      displayName: input.displayName ?? null,
      role: input.role ?? 'member',
      pendingAssignment: input.pendingAssignment ?? true,
      idpSubject: input.idpSubject ?? null,
      idpId: input.idpId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    list.push(row);
    membersByOrg.set(input.orgId, list);
    return structuredClone(row);
  }

  async updateMemberRole(
    orgId: string,
    memberId: string,
    role: OrgMemberRole,
  ): Promise<OrgMember | null> {
    const list = membersByOrg.get(orgId) ?? [];
    const row = list.find((m) => m.id === memberId);
    if (!row) return null;
    row.role = role;
    row.pendingAssignment = false;
    row.updatedAt = new Date().toISOString();
    return structuredClone(row);
  }
}
