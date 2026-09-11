import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Nis2Assessment } from '@annex21/shared';
import { assessments } from '../common/in-memory.store';
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
  constructor(private readonly audit: AuditService) {}

  list(orgId?: string): Nis2Assessment[] {
    const rows = orgId
      ? assessments.filter((a) => a.orgId === orgId)
      : [...assessments];
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getById(id: string): Nis2Assessment {
    const row = assessments.find((a) => a.id === id);
    if (!row) throw new NotFoundException(`Assessment ${id} introuvable`);
    return row;
  }

  create(dto: CreateAssessmentDto, actorUserId?: string): Nis2Assessment {
    const ts = new Date().toISOString();
    const row: Nis2Assessment = {
      id: `asmt_${Date.now()}`,
      orgId: dto.orgId,
      status: 'draft',
      answers: dto.answers ?? {},
      disclaimerAck: false,
      version: 1,
      createdAt: ts,
      updatedAt: ts,
    };
    assessments.push(row);
    this.audit.append({
      orgId: row.orgId,
      action: 'assessment.created',
      entityType: 'nis2_assessment',
      entityId: row.id,
      actorUserId,
    });
    return row;
  }

  update(
    id: string,
    dto: UpdateAssessmentDto,
    actorUserId?: string,
  ): Nis2Assessment {
    const row = this.getById(id);
    if (row.status === 'completed') {
      throw new BadRequestException(
        'Assessment complété — créer une nouvelle version (brouillon)',
      );
    }
    if (dto.answers) {
      row.answers = { ...row.answers, ...dto.answers };
    }
    row.updatedAt = new Date().toISOString();
    this.audit.append({
      orgId: row.orgId,
      action: 'assessment.updated',
      entityType: 'nis2_assessment',
      entityId: row.id,
      actorUserId,
      payload: { keys: Object.keys(dto.answers ?? {}) },
    });
    return row;
  }

  complete(id: string, actorUserId?: string): Nis2Assessment {
    const row = this.getById(id);
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

    this.audit.append({
      orgId: row.orgId,
      action: 'assessment.completed',
      entityType: 'nis2_assessment',
      entityId: row.id,
      actorUserId,
      payload: { scopeStatus, maturityScore, gapsCount: gaps.length },
    });
    return row;
  }
}
