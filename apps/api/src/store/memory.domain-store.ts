import type {
  AuditEvent,
  Control,
  Incident,
  Nis2Assessment,
  PlaybookTemplate,
} from '@annex21/shared';
import {
  assessments,
  auditEvents,
  controls,
  incidents,
  playbookTemplates,
} from '../common/in-memory.store';
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
}
