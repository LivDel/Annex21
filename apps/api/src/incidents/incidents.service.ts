import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Incident, IncidentStep, IncidentSlaCountdown } from '@annex21/shared';
import { DOMAIN_STORE, type DomainStore } from '../store/domain-store';
import { AuditService } from '../audit/audit.service';
import { PlaybooksService } from '../playbooks/playbooks.service';
import { EvidenceService } from '../evidence/evidence.service';
import { OpenIncidentDto } from './dto/open-incident.dto';
import { buildSla, countdownFor } from './sla';

@Injectable()
export class IncidentsService {
  constructor(
    @Inject(DOMAIN_STORE) private readonly store: DomainStore,
    private readonly audit: AuditService,
    private readonly playbooks: PlaybooksService,
    private readonly evidence: EvidenceService,
  ) {}

  list(orgId?: string): Promise<Incident[]> {
    return this.store.listIncidents(orgId);
  }

  async getById(id: string): Promise<Incident> {
    const row = await this.store.getIncident(id);
    if (!row) throw new NotFoundException(`Incident ${id} introuvable`);
    return row;
  }

  async openSlaCountdowns(orgId?: string): Promise<IncidentSlaCountdown[]> {
    const rows = await this.list(orgId);
    return rows.filter((i) => i.status === 'open').map((i) => countdownFor(i));
  }

  async open(dto: OpenIncidentDto, actorUserId?: string): Promise<Incident> {
    const template = await this.playbooks.getTemplate(dto.playbookTemplateId);
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
    const saved = await this.store.createIncident(row);

    await this.audit.append({
      orgId: saved.orgId,
      action: 'incident.opened',
      entityType: 'incident',
      entityId: saved.id,
      actorUserId,
      payload: {
        playbookTemplateId: template.id,
        sla: saved.sla,
      },
    });
    return saved;
  }

  async linkEvidence(
    incidentId: string,
    stepId: string,
    evidenceId: string,
    actorUserId?: string,
  ): Promise<IncidentStep> {
    const incident = await this.getById(incidentId);
    if (incident.status !== 'open') {
      throw new BadRequestException('Incident clôturé');
    }
    const step = incident.steps.find((s) => s.id === stepId);
    if (!step) throw new NotFoundException(`Étape ${stepId} introuvable`);

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
    await this.store.saveIncident(incident);

    await this.audit.append({
      orgId: incident.orgId,
      action: 'incident.step.evidence_linked',
      entityType: 'incident_step',
      entityId: step.id,
      actorUserId,
      payload: { evidenceId, incidentId },
    });
    return step;
  }

  async completeStep(
    incidentId: string,
    stepId: string,
    evidenceIds: string[] | undefined,
    actorUserId?: string,
  ): Promise<IncidentStep> {
    const incident = await this.getById(incidentId);
    if (incident.status !== 'open') {
      throw new BadRequestException('Incident clôturé');
    }
    const step = incident.steps.find((s) => s.id === stepId);
    if (!step) throw new NotFoundException(`Étape ${stepId} introuvable`);
    if (step.status === 'done') {
      throw new BadRequestException('Étape déjà complétée');
    }

    for (const eid of evidenceIds ?? []) {
      await this.linkEvidence(incidentId, stepId, eid, actorUserId);
    }

    // Reload after possible linkEvidence saves
    const fresh = await this.getById(incidentId);
    const freshStep = fresh.steps.find((s) => s.id === stepId);
    if (!freshStep) throw new NotFoundException(`Étape ${stepId} introuvable`);

    if (freshStep.requiresEvidence && freshStep.evidenceLinks.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'EVIDENCE_REQUIRED',
        message:
          'Étape REJECTED : requires_evidence && 0 preuve liée. Liez au moins une evidence.',
      });
    }

    freshStep.status = 'done';
    freshStep.completedAt = new Date().toISOString();
    freshStep.completedBy = actorUserId;
    fresh.updatedAt = freshStep.completedAt;
    await this.store.saveIncident(fresh);

    await this.audit.append({
      orgId: fresh.orgId,
      action: 'incident.step.completed',
      entityType: 'incident_step',
      entityId: freshStep.id,
      actorUserId,
      payload: {
        incidentId,
        evidenceCount: freshStep.evidenceLinks.length,
        window: freshStep.window,
      },
    });
    return freshStep;
  }

  async close(incidentId: string, actorUserId?: string): Promise<Incident> {
    const incident = await this.getById(incidentId);
    if (incident.status === 'closed') {
      throw new BadRequestException('Incident déjà clôturé');
    }
    const ts = new Date().toISOString();
    incident.status = 'closed';
    incident.closedAt = ts;
    incident.updatedAt = ts;
    const saved = await this.store.saveIncident(incident);

    await this.audit.append({
      orgId: saved.orgId,
      action: 'incident.closed',
      entityType: 'incident',
      entityId: saved.id,
      actorUserId,
      payload: {
        stepsDone: saved.steps.filter((s) => s.status === 'done').length,
        stepsTotal: saved.steps.length,
      },
    });
    return saved;
  }
}
