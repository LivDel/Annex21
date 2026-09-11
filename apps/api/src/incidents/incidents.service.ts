import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Incident, IncidentStep, IncidentSlaCountdown } from '@annex21/shared';
import { incidents } from '../common/in-memory.store';
import { AuditService } from '../audit/audit.service';
import { PlaybooksService } from '../playbooks/playbooks.service';
import { EvidenceService } from '../evidence/evidence.service';
import { OpenIncidentDto } from './dto/open-incident.dto';
import { buildSla, countdownFor } from './sla';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly audit: AuditService,
    private readonly playbooks: PlaybooksService,
    private readonly evidence: EvidenceService,
  ) {}

  list(orgId?: string): Incident[] {
    const rows = orgId
      ? incidents.filter((i) => i.orgId === orgId)
      : [...incidents];
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id: string): Incident {
    const row = incidents.find((i) => i.id === id);
    if (!row) throw new NotFoundException(`Incident ${id} introuvable`);
    return row;
  }

  openSlaCountdowns(orgId?: string): IncidentSlaCountdown[] {
    return this.list(orgId)
      .filter((i) => i.status === 'open')
      .map((i) => countdownFor(i));
  }

  open(dto: OpenIncidentDto, actorUserId?: string): Incident {
    const template = this.playbooks.getTemplate(dto.playbookTemplateId);
    const openedAt = new Date();
    const ts = openedAt.toISOString();
    const incidentId = `inc_${Date.now()}`;

    const steps: IncidentStep[] = template.body.steps.map((s) => ({
      id: `${incidentId}_${s.id}`,
      incidentId,
      templateStepId: s.id,
      sortOrder: s.sortOrder,
      window: s.window,
      title: s.title,
      description: s.description,
      ownerRole: s.ownerRole,
      requiresEvidence: s.requiresEvidence,
      status: 'pending',
      evidenceLinks: [],
    }));

    const row: Incident = {
      id: incidentId,
      orgId: dto.orgId,
      playbookTemplateId: template.id,
      title: dto.title,
      status: 'open',
      sla: buildSla(openedAt),
      steps,
      createdBy: dto.createdBy ?? actorUserId,
      createdAt: ts,
      updatedAt: ts,
    };
    incidents.push(row);

    this.audit.append({
      orgId: row.orgId,
      action: 'incident.opened',
      entityType: 'incident',
      entityId: row.id,
      actorUserId,
      payload: {
        playbookTemplateId: template.id,
        sla: row.sla,
      },
    });
    return row;
  }

  linkEvidence(
    incidentId: string,
    stepId: string,
    evidenceId: string,
    actorUserId?: string,
  ): IncidentStep {
    const incident = this.getById(incidentId);
    if (incident.status !== 'open') {
      throw new BadRequestException('Incident clôturé');
    }
    const step = incident.steps.find((s) => s.id === stepId);
    if (!step) throw new NotFoundException(`Étape ${stepId} introuvable`);

    // Valide que la preuve existe (stub ids OK)
    const ev = this.evidence.getById(evidenceId);
    if (ev.orgId !== incident.orgId) {
      throw new BadRequestException('Preuve hors organisation');
    }
    if (step.evidenceLinks.some((l) => l.evidenceId === evidenceId)) {
      return step;
    }

    const link = {
      id: `ise_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      incidentStepId: step.id,
      evidenceId,
      linkedAt: new Date().toISOString(),
      linkedBy: actorUserId,
    };
    step.evidenceLinks.push(link);
    incident.updatedAt = new Date().toISOString();

    this.audit.append({
      orgId: incident.orgId,
      action: 'incident.step.evidence_linked',
      entityType: 'incident_step',
      entityId: step.id,
      actorUserId,
      payload: { evidenceId, incidentId },
    });
    return step;
  }

  completeStep(
    incidentId: string,
    stepId: string,
    evidenceIds: string[] | undefined,
    actorUserId?: string,
  ): IncidentStep {
    const incident = this.getById(incidentId);
    if (incident.status !== 'open') {
      throw new BadRequestException('Incident clôturé');
    }
    const step = incident.steps.find((s) => s.id === stepId);
    if (!step) throw new NotFoundException(`Étape ${stepId} introuvable`);
    if (step.status === 'done') {
      throw new BadRequestException('Étape déjà complétée');
    }

    // Lier d'éventuelles preuves fournies dans le body
    for (const eid of evidenceIds ?? []) {
      this.linkEvidence(incidentId, stepId, eid, actorUserId);
    }

    if (step.requiresEvidence && step.evidenceLinks.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'EVIDENCE_REQUIRED',
        message:
          'Étape REJECTED : requires_evidence && 0 preuve liée. Liez au moins une evidence.',
      });
    }

    step.status = 'done';
    step.completedAt = new Date().toISOString();
    step.completedBy = actorUserId;
    incident.updatedAt = step.completedAt;

    this.audit.append({
      orgId: incident.orgId,
      action: 'incident.step.completed',
      entityType: 'incident_step',
      entityId: step.id,
      actorUserId,
      payload: {
        incidentId,
        evidenceCount: step.evidenceLinks.length,
        window: step.window,
      },
    });
    return step;
  }

  close(incidentId: string, actorUserId?: string): Incident {
    const incident = this.getById(incidentId);
    if (incident.status === 'closed') {
      throw new BadRequestException('Incident déjà clôturé');
    }
    const ts = new Date().toISOString();
    incident.status = 'closed';
    incident.closedAt = ts;
    incident.updatedAt = ts;

    this.audit.append({
      orgId: incident.orgId,
      action: 'incident.closed',
      entityType: 'incident',
      entityId: incident.id,
      actorUserId,
      payload: {
        stepsDone: incident.steps.filter((s) => s.status === 'done').length,
        stepsTotal: incident.steps.length,
      },
    });
    return incident;
  }
}
