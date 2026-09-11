import { Injectable, NotFoundException } from '@nestjs/common';
import type { PublicTrustCenter, TrustCenterView } from '@annex21/shared';
import { trustCenters } from '../common/in-memory.store';

/**
 * RG-07 : draft ≠ public — getPublicBySlug refuse tout statut autre que published.
 * RG-08 : toPublic() omet toute evidence (les preuves ne sont pas dans TrustCenterView).
 */
@Injectable()
export class TrustService {
  findBySlug(orgSlug: string): TrustCenterView | undefined {
    return trustCenters.find((t) => t.org.slug === orgSlug);
  }

  /** Endpoint authentifié : draft autorisé, toujours sans evidence brute. */
  getAuthenticated(orgSlug: string): TrustCenterView {
    const trust = this.findBySlug(orgSlug);
    if (!trust) {
      throw new NotFoundException(`Trust Center introuvable pour ${orgSlug}`);
    }
    return trust;
  }

  /**
   * Endpoint PUBLIC : published only.
   * Un org en draft → 404 (pas de fuite d'existence détaillée au-delà du 404).
   */
  getPublicBySlug(orgSlug: string): PublicTrustCenter {
    const trust = this.findBySlug(orgSlug);
    if (!trust || trust.status !== 'published') {
      throw new NotFoundException(`Trust Center public introuvable pour ${orgSlug}`);
    }
    return this.toPublic(trust);
  }

  publish(orgSlug: string): TrustCenterView {
    const trust = this.getAuthenticated(orgSlug);
    trust.status = 'published';
    delete trust.unpublishedNotes;
    // RG-15 : audit trail append-only — stub (à brancher sur AuditEvent in-EU).
    return trust;
  }

  private toPublic(trust: TrustCenterView): PublicTrustCenter {
    return {
      org: trust.org,
      status: 'published',
      locale: trust.locale,
      controls: trust.controls,
      attestations: trust.attestations,
      // Intentionnellement aucun champ evidence / storageKey / hash.
    };
  }
}
