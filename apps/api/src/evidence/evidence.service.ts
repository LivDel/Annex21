import { Injectable, NotFoundException } from '@nestjs/common';
import type { Evidence } from '@annex21/shared';
import { evidenceItems } from '../common/in-memory.store';
import { CreateEvidenceDto } from './dto/create-evidence.dto';

/**
 * Bibliothèque de preuves — PRIVÉE.
 * RG-08 : ces payloads ne sont jamais montés sur /public/trust.
 * RG-10 : storageKey préfixé eu/ (MinIO in-EU).
 */
@Injectable()
export class EvidenceService {
  list(orgId?: string): Evidence[] {
    if (!orgId) return evidenceItems;
    return evidenceItems.filter((e) => e.orgId === orgId);
  }

  getById(id: string): Evidence {
    const item = evidenceItems.find((e) => e.id === id);
    if (!item) throw new NotFoundException(`Evidence ${id} introuvable`);
    return item;
  }

  create(dto: CreateEvidenceDto): Evidence {
    const created: Evidence = {
      id: `ev_${Date.now()}`,
      orgId: dto.orgId,
      filename: dto.filename,
      hash: `sha256:stub-${Date.now()}`,
      provenance: dto.provenance,
      collectedAt: new Date().toISOString(),
      controlId: dto.controlId,
      storageKey: `eu/${dto.orgId}/${Date.now()}/${dto.filename}`,
    };
    evidenceItems.push(created);
    return created;
  }
}
