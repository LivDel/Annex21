import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Nis2Assessment } from '@annex21/shared';
import { DOMAIN_STORE, type DomainStore } from '../store/domain-store';
import { AuditService } from '../audit/audit.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import {
  computeDomainScores,
  computeGaps,
  computeMaturity,
  computeScope,
} from './assessment-scoring';

@Injectable()
export class AssessmentsService {
  constructor(
    @Inject(DOMAIN_STORE) private readonly store: DomainStore,
    private readonly audit: AuditService,
  ) {}

  list(orgId?: string): Promise<Nis2Assessment[]> {
    return this.store.listAssessments(orgId);
  }

  async getById(id: string): Promise<Nis2Assessment> {
    const row = await this.store.getAssessment(id);
    if (!row) throw new NotFoundException(`Assessment ${id} introuvable`);
    return row;
  }

  async create(
    dto: CreateAssessmentDto,
    actorUserId?: string,
  ): Promise<Nis2Assessment> {
    const row = await this.store.createAssessment({
      orgId: dto.orgId,
      answers: dto.answers,
    });
    await this.audit.append({
      orgId: row.orgId,
      action: 'assessment.created',
      entityType: 'nis2_assessment',
      entityId: row.id,
      actorUserId,
    });
    return row;
  }

  async update(
    id: string,
    dto: UpdateAssessmentDto,
    actorUserId?: string,
  ): Promise<Nis2Assessment> {
    const row = await this.getById(id);
    if (row.status === 'completed') {
      throw new BadRequestException(
        'Assessment complété — créer une nouvelle version (brouillon)',
      );
    }
    if (dto.answers) {
      row.answers = { ...row.answers, ...dto.answers };
    }
    row.updatedAt = new Date().toISOString();
    const saved = await this.store.saveAssessment(row);
    await this.audit.append({
      orgId: saved.orgId,
      action: 'assessment.updated',
      entityType: 'nis2_assessment',
      entityId: saved.id,
      actorUserId,
      payload: { keys: Object.keys(dto.answers ?? {}) },
    });
    return saved;
  }

  async complete(id: string, actorUserId?: string): Promise<Nis2Assessment> {
    const row = await this.getById(id);
    if (row.status === 'completed') {
      throw new BadRequestException('Assessment déjà complété');
    }
    const domainScores = computeDomainScores(row.answers);
    const maturityScore = computeMaturity(domainScores);
    const scopeStatus = computeScope(row.answers);
    const gaps = computeGaps(domainScores);
    const ts = new Date().toISOString();

    row.status = 'completed';
    row.disclaimerAck = true;
    row.domainScores = domainScores;
    row.maturityScore = maturityScore;
    row.scopeStatus = scopeStatus;
    row.gaps = gaps;
    row.completedAt = ts;
    row.updatedAt = ts;
    row.version = row.version + 1;

    const saved = await this.store.saveAssessment(row);
    await this.audit.append({
      orgId: saved.orgId,
      action: 'assessment.completed',
      entityType: 'nis2_assessment',
      entityId: saved.id,
      actorUserId,
      payload: { scopeStatus, maturityScore, gapsCount: gaps.length },
    });
    return saved;
  }
}
