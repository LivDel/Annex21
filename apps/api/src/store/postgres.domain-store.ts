import type {
  AssessmentAnswers,
  AssessmentGap,
  AuditEvent,
  Control,
  Incident,
  IncidentStep,
  IncidentStepEvidenceLink,
  Nis2Assessment,
  Nis2Domain,
  PlaybookTemplate,
  PlaybookTemplateBody,
  ScopeStatus,
} from '@annex21/shared';
import type { PgService } from '../db/pg.service';
import type {
  AppendAuditInput,
  CreateAssessmentInput,
  DomainStore,
  UpdateControlInput,
} from './domain-store';

function asJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function mapAssessment(r: Record<string, unknown>): Nis2Assessment {
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    status: r.status as Nis2Assessment['status'],
    answers: asJson<AssessmentAnswers>(r.answers, {}),
    scopeStatus: (r.scope_status as ScopeStatus | null) ?? undefined,
    maturityScore:
      r.maturity_score == null ? undefined : Number(r.maturity_score),
    domainScores: asJson<Partial<Record<Nis2Domain, number>> | undefined>(
      r.domain_scores,
      undefined,
    ),
    gaps: asJson<AssessmentGap[] | undefined>(r.gaps, undefined),
    disclaimerAck: Boolean(r.disclaimer_ack),
    version: Number(r.version),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
    completedAt: r.completed_at
      ? new Date(String(r.completed_at)).toISOString()
      : undefined,
  };
}

function mapControl(r: Record<string, unknown>): Control {
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    code: String(r.code),
    domain: String(r.domain),
    title: String(r.title),
    status: r.status as Control['status'],
    owner: r.owner ? String(r.owner) : undefined,
    dueAt: r.due_at ? new Date(String(r.due_at)).toISOString() : undefined,
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

function mapPlaybook(r: Record<string, unknown>): PlaybookTemplate {
  return {
    id: String(r.id),
    version: String(r.version),
    name: String(r.name),
    body: asJson<PlaybookTemplateBody>(r.body, {
      authority: 'ANSSI',
      locale: 'fr',
      label: '',
      windows: [],
      steps: [],
    }),
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}

function mapAudit(r: Record<string, unknown>): AuditEvent {
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    actorUserId: r.actor_user_id ? String(r.actor_user_id) : undefined,
    action: r.action as AuditEvent['action'],
    entityType: String(r.entity_type),
    entityId: String(r.entity_id),
    payload: asJson<Record<string, unknown> | undefined>(r.payload, undefined),
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}

export class PostgresDomainStore implements DomainStore {
  readonly mode = 'postgres' as const;

  constructor(private readonly pg: PgService) {}

  async listAssessments(orgId?: string): Promise<Nis2Assessment[]> {
    const res = orgId
      ? await this.pg.query(
          `SELECT * FROM nis2_assessments WHERE org_id = $1 ORDER BY updated_at DESC`,
          [orgId],
        )
      : await this.pg.query(
          `SELECT * FROM nis2_assessments ORDER BY updated_at DESC`,
        );
    return res.rows.map((r) => mapAssessment(r as Record<string, unknown>));
  }

  async getAssessment(id: string): Promise<Nis2Assessment | null> {
    const res = await this.pg.query(
      `SELECT * FROM nis2_assessments WHERE id = $1`,
      [id],
    );
    const row = res.rows[0];
    return row ? mapAssessment(row as Record<string, unknown>) : null;
  }

  async createAssessment(input: CreateAssessmentInput): Promise<Nis2Assessment> {
    const ts = new Date().toISOString();
    const id = `asmt_${Date.now()}`;
    const answers = input.answers ?? {};
    await this.pg.query(
      `INSERT INTO nis2_assessments
        (id, org_id, status, answers, disclaimer_ack, version, created_at, updated_at)
       VALUES ($1, $2, 'draft', $3::jsonb, FALSE, 1, $4, $4)`,
      [id, input.orgId, JSON.stringify(answers), ts],
    );
    const created = await this.getAssessment(id);
    if (!created) throw new Error('createAssessment failed');
    return created;
  }

  async saveAssessment(row: Nis2Assessment): Promise<Nis2Assessment> {
    await this.pg.query(
      `UPDATE nis2_assessments SET
        status = $2,
        answers = $3::jsonb,
        scope_status = $4,
        maturity_score = $5,
        domain_scores = $6::jsonb,
        gaps = $7::jsonb,
        disclaimer_ack = $8,
        version = $9,
        updated_at = $10,
        completed_at = $11
       WHERE id = $1`,
      [
        row.id,
        row.status,
        JSON.stringify(row.answers ?? {}),
        row.scopeStatus ?? null,
        row.maturityScore ?? null,
        row.domainScores ? JSON.stringify(row.domainScores) : null,
        row.gaps ? JSON.stringify(row.gaps) : null,
        row.disclaimerAck,
        row.version,
        row.updatedAt,
        row.completedAt ?? null,
      ],
    );
    return (await this.getAssessment(row.id)) ?? row;
  }

  async listControls(orgId?: string): Promise<Control[]> {
    const res = orgId
      ? await this.pg.query(
          `SELECT * FROM controls WHERE org_id = $1 ORDER BY code`,
          [orgId],
        )
      : await this.pg.query(`SELECT * FROM controls ORDER BY code`);
    return res.rows.map((r) => mapControl(r as Record<string, unknown>));
  }

  async getControl(id: string): Promise<Control | null> {
    const res = await this.pg.query(`SELECT * FROM controls WHERE id = $1`, [
      id,
    ]);
    const row = res.rows[0];
    return row ? mapControl(row as Record<string, unknown>) : null;
  }

  async updateControl(
    id: string,
    patch: UpdateControlInput,
  ): Promise<Control | null> {
    const current = await this.getControl(id);
    if (!current) return null;
    const status = patch.status ?? current.status;
    const owner = patch.owner !== undefined ? patch.owner : current.owner;
    const dueAt =
      patch.dueAt !== undefined ? patch.dueAt || undefined : current.dueAt;
    const updatedAt = new Date().toISOString();
    await this.pg.query(
      `UPDATE controls SET status = $2, owner = $3, due_at = $4, updated_at = $5 WHERE id = $1`,
      [id, status, owner ?? null, dueAt ?? null, updatedAt],
    );
    return this.getControl(id);
  }

  async listPlaybookTemplates(): Promise<PlaybookTemplate[]> {
    const res = await this.pg.query(
      `SELECT * FROM playbook_templates ORDER BY created_at`,
    );
    return res.rows.map((r) => mapPlaybook(r as Record<string, unknown>));
  }

  async getPlaybookTemplate(id: string): Promise<PlaybookTemplate | null> {
    const res = await this.pg.query(
      `SELECT * FROM playbook_templates WHERE id = $1`,
      [id],
    );
    const row = res.rows[0];
    return row ? mapPlaybook(row as Record<string, unknown>) : null;
  }

  async listIncidents(orgId?: string): Promise<Incident[]> {
    const res = orgId
      ? await this.pg.query(
          `SELECT id FROM incidents WHERE org_id = $1 ORDER BY created_at DESC`,
          [orgId],
        )
      : await this.pg.query(
          `SELECT id FROM incidents ORDER BY created_at DESC`,
        );
    const out: Incident[] = [];
    for (const r of res.rows) {
      const full = await this.getIncident(String(r.id));
      if (full) out.push(full);
    }
    return out;
  }

  async getIncident(id: string): Promise<Incident | null> {
    const res = await this.pg.query(`SELECT * FROM incidents WHERE id = $1`, [
      id,
    ]);
    const row = res.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;

    const stepsRes = await this.pg.query(
      `SELECT * FROM incident_steps WHERE incident_id = $1 ORDER BY sort_order`,
      [id],
    );
    const steps: IncidentStep[] = [];
    for (const s of stepsRes.rows as Record<string, unknown>[]) {
      const linksRes = await this.pg.query(
        `SELECT * FROM incident_step_evidence WHERE incident_step_id = $1`,
        [s.id],
      );
      const evidenceLinks: IncidentStepEvidenceLink[] = (
        linksRes.rows as Record<string, unknown>[]
      ).map((l) => ({
        id: String(l.id),
        incidentStepId: String(l.incident_step_id),
        evidenceId: String(l.evidence_id),
        linkedAt: new Date(String(l.linked_at)).toISOString(),
        linkedBy: l.linked_by ? String(l.linked_by) : undefined,
      }));
      steps.push({
        id: String(s.id),
        incidentId: String(s.incident_id),
        templateStepId: String(s.template_step_id),
        sortOrder: Number(s.sort_order),
        window: s.window as IncidentStep['window'],
        title: String(s.title),
        description: String(s.description ?? ''),
        ownerRole: s.owner_role as IncidentStep['ownerRole'],
        requiresEvidence: Boolean(s.requires_evidence),
        status: s.status as IncidentStep['status'],
        completedAt: s.completed_at
          ? new Date(String(s.completed_at)).toISOString()
          : undefined,
        completedBy: s.completed_by ? String(s.completed_by) : undefined,
        evidenceLinks,
      });
    }

    return {
      id: String(row.id),
      orgId: String(row.org_id),
      playbookTemplateId: String(row.playbook_template_id),
      title: String(row.title),
      status: row.status as Incident['status'],
      sla: {
        openedAt: new Date(String(row.opened_at)).toISOString(),
        due24hAt: new Date(String(row.due_24h_at)).toISOString(),
        due72hAt: new Date(String(row.due_72h_at)).toISOString(),
        due1mAt: new Date(String(row.due_1m_at)).toISOString(),
      },
      steps,
      closedAt: row.closed_at
        ? new Date(String(row.closed_at)).toISOString()
        : undefined,
      createdBy: row.created_by ? String(row.created_by) : undefined,
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    };
  }

  async createIncident(row: Incident): Promise<Incident> {
    const client = await this.pg.getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO incidents
          (id, org_id, playbook_template_id, title, status, opened_at, due_24h_at, due_72h_at, due_1m_at, closed_at, created_by, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          row.id,
          row.orgId,
          row.playbookTemplateId,
          row.title,
          row.status,
          row.sla.openedAt,
          row.sla.due24hAt,
          row.sla.due72hAt,
          row.sla.due1mAt,
          row.closedAt ?? null,
          row.createdBy ?? null,
          row.createdAt,
          row.updatedAt,
        ],
      );
      for (const s of row.steps) {
        await client.query(
          `INSERT INTO incident_steps
            (id, incident_id, template_step_id, sort_order, window, title, description, owner_role, requires_evidence, status, completed_at, completed_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            s.id,
            s.incidentId,
            s.templateStepId,
            s.sortOrder,
            s.window,
            s.title,
            s.description,
            s.ownerRole,
            s.requiresEvidence,
            s.status,
            s.completedAt ?? null,
            s.completedBy ?? null,
          ],
        );
        for (const link of s.evidenceLinks) {
          await client.query(
            `INSERT INTO incident_step_evidence (id, incident_step_id, evidence_id, linked_at, linked_by)
             VALUES ($1,$2,$3,$4,$5)`,
            [
              link.id,
              link.incidentStepId,
              link.evidenceId,
              link.linkedAt,
              link.linkedBy ?? null,
            ],
          );
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return (await this.getIncident(row.id)) ?? row;
  }

  async saveIncident(row: Incident): Promise<Incident> {
    const client = await this.pg.getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE incidents SET
          title = $2, status = $3, closed_at = $4, updated_at = $5
         WHERE id = $1`,
        [row.id, row.title, row.status, row.closedAt ?? null, row.updatedAt],
      );
      for (const s of row.steps) {
        await client.query(
          `UPDATE incident_steps SET
            status = $2, completed_at = $3, completed_by = $4
           WHERE id = $1`,
          [s.id, s.status, s.completedAt ?? null, s.completedBy ?? null],
        );
        for (const link of s.evidenceLinks) {
          await client.query(
            `INSERT INTO incident_step_evidence (id, incident_step_id, evidence_id, linked_at, linked_by)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (incident_step_id, evidence_id) DO NOTHING`,
            [
              link.id,
              link.incidentStepId,
              link.evidenceId,
              link.linkedAt,
              link.linkedBy ?? null,
            ],
          );
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return (await this.getIncident(row.id)) ?? row;
  }

  async appendAudit(input: AppendAuditInput): Promise<AuditEvent> {
    const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date().toISOString();
    await this.pg.query(
      `INSERT INTO audit_events
        (id, org_id, actor_user_id, action, entity_type, entity_id, payload, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
      [
        id,
        input.orgId,
        input.actorUserId ?? null,
        input.action,
        input.entityType,
        input.entityId,
        input.payload ? JSON.stringify(input.payload) : null,
        createdAt,
      ],
    );
    return {
      id,
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload,
      createdAt,
    };
  }

  async listAudit(orgId?: string, limit = 100): Promise<AuditEvent[]> {
    const res = orgId
      ? await this.pg.query(
          `SELECT * FROM audit_events WHERE org_id = $1 ORDER BY created_at DESC LIMIT $2`,
          [orgId, limit],
        )
      : await this.pg.query(
          `SELECT * FROM audit_events ORDER BY created_at DESC LIMIT $1`,
          [limit],
        );
    return res.rows.map((r) => mapAudit(r as Record<string, unknown>));
  }
}
