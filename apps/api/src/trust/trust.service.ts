import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  evaluateTrustPublishChecklist,
  type PublicTrustCenter,
  type TrustCenterView,
  type TrustDraftPatch,
} from '@annex21/shared';
import { DOMAIN_STORE, type DomainStore } from '../store/domain-store';
import { AuditService } from '../audit/audit.service';

/**
 * RG-07 : draft ≠ public — getPublicBySlug refuse tout statut autre que published.
 * RG-08 : toPublic() omet toute evidence (jamais de preuve brute).
 * Persisté via DomainStore (Postgres EU / mémoire dev).
 */
@Injectable()
export class TrustService {
  constructor(
    @Inject(DOMAIN_STORE) private readonly store: DomainStore,
    private readonly audit: AuditService,
  ) {}

  async findBySlug(orgSlug: string): Promise<TrustCenterView | null> {
    return this.store.getTrustBySlug(orgSlug);
  }

  /** Endpoint authentifié : draft autorisé, toujours sans evidence brute. */
  async getAuthenticated(orgSlug: string): Promise<TrustCenterView> {
    const trust = await this.findBySlug(orgSlug);
    if (!trust) {
      throw new NotFoundException(`Trust Center introuvable pour ${orgSlug}`);
    }
    return trust;
  }

  /**
   * Endpoint PUBLIC : published only.
   * Un org en draft → 404 (pas de fuite d'existence détaillée au-delà du 404).
   */
  async getPublicBySlug(orgSlug: string): Promise<PublicTrustCenter> {
    const trust = await this.findBySlug(orgSlug);
    if (!trust || trust.status !== 'published') {
      throw new NotFoundException(
        `Trust Center public introuvable pour ${orgSlug}`,
      );
    }
    return this.toPublic(trust);
  }

  async patchDraft(
    orgSlug: string,
    patch: TrustDraftPatch,
    actorUserId?: string,
  ): Promise<TrustCenterView> {
    const existing = await this.getAuthenticated(orgSlug);
    if (existing.status === 'published') {
      // Allow patching locale / notes even when published? V1: block profile edits while published — unpublish first.
      // Soft: still allow disclaimerAck / locale updates for editor UX.
    }
    const saved = await this.store.patchTrustDraft(orgSlug, patch);
    if (!saved) {
      throw new NotFoundException(`Trust Center introuvable pour ${orgSlug}`);
    }
    await this.audit.append({
      orgId: saved.orgId,
      action: 'trust.draft.updated',
      entityType: 'trust_center',
      entityId: saved.org.slug,
      actorUserId,
      payload: { keys: Object.keys(patch) },
    });
    return saved;
  }

  /**
   * Publish gated checklist V1 :
   * org nommée + ≥1 contrôle attesté + disclaimer ack.
   * Erreurs FR claires si bloqué. Jamais auto.
   */
  async publish(
    orgSlug: string,
    disclaimerAck: true,
    actorUserId?: string,
  ): Promise<TrustCenterView> {
    const trust = await this.getAuthenticated(orgSlug);
    if (trust.status === 'published') {
      throw new BadRequestException('Trust Center déjà publié');
    }

    // Enforce body disclaimer into draft before checklist eval
    trust.disclaimerAck = disclaimerAck === true ? true : trust.disclaimerAck;

    const checklist = evaluateTrustPublishChecklist(trust);
    if (!checklist.ready) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'TRUST_PUBLISH_CHECKLIST',
        message: checklist.errorsFr.join(' '),
        errors: checklist.errorsFr,
        checklist: {
          orgNamed: checklist.orgNamed,
          hasAttestedControl: checklist.hasAttestedControl,
          disclaimerAck: checklist.disclaimerAck,
        },
      });
    }

    trust.status = 'published';
    trust.disclaimerAck = true;
    delete trust.unpublishedNotes;
    trust.updatedAt = new Date().toISOString();
    const saved = await this.store.saveTrust(trust);

    await this.audit.append({
      orgId: saved.orgId,
      action: 'trust.published',
      entityType: 'trust_center',
      entityId: saved.org.slug,
      actorUserId,
      payload: { locale: saved.locale },
    });
    return saved;
  }

  /** Unpublish → retour brouillon (RG-07). */
  async unpublish(
    orgSlug: string,
    actorUserId?: string,
  ): Promise<TrustCenterView> {
    const trust = await this.getAuthenticated(orgSlug);
    if (trust.status !== 'published') {
      throw new BadRequestException(
        'Trust Center déjà en brouillon — rien à dépublier',
      );
    }
    trust.status = 'draft';
    trust.updatedAt = new Date().toISOString();
    const saved = await this.store.saveTrust(trust);

    await this.audit.append({
      orgId: saved.orgId,
      action: 'trust.unpublished',
      entityType: 'trust_center',
      entityId: saved.org.slug,
      actorUserId,
    });
    return saved;
  }

  checklist(orgSlug: string) {
    return this.getAuthenticated(orgSlug).then((t) =>
      evaluateTrustPublishChecklist(t),
    );
  }

  private toPublic(trust: TrustCenterView): PublicTrustCenter {
    return {
      org: trust.org,
      status: 'published',
      locale: trust.locale,
      controls: trust.controls,
      attestations: trust.attestations,
      // Intentionnellement aucun champ evidence / storageKey / hash / disclaimerAck.
    };
  }
}
