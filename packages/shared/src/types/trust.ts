/**
 * Statut de publication du Trust Center.
 * RG-07 : draft ≠ public — un contenu draft n'est JAMAIS renvoyé par l'API publique.
 */
export type TrustStatus = 'draft' | 'published';

export type TrustLocale = 'fr' | 'en' | 'de';

export type TrustControlStatus = 'attested' | 'in_progress' | 'preparing';

/** Résumé de contrôle NIS2 — aucun identifiant de preuve brute. */
export interface TrustControlSummary {
  id: string;
  domain: string;
  status: TrustControlStatus;
}

export interface TrustAttestation {
  id: string;
  title: string;
  publishedAt: string;
}

/**
 * Payload public du Trust Center.
 * RG-08 : PAS de preuves brutes, PAS de fichiers, PAS de hashes, PAS de connecteurs.
 */
export interface PublicTrustCenter {
  org: {
    slug: string;
    name: string;
    country: string;
  };
  status: 'published';
  locale: TrustLocale;
  controls: TrustControlSummary[];
  attestations: TrustAttestation[];
}

/**
 * Vue éditeur / authentifiée. Peut être draft.
 * Toujours SANS evidence brute — l'evidence vit sur /evidence (privé).
 */
export interface TrustCenterView {
  orgId: string;
  org: {
    slug: string;
    name: string;
    country: string;
  };
  status: TrustStatus;
  locale: TrustLocale;
  controls: TrustControlSummary[];
  attestations: TrustAttestation[];
  /** Checklist V1 — requis pour publish. */
  disclaimerAck: boolean;
  unpublishedNotes?: string;
  updatedAt?: string;
}

/** Patch brouillon (auth) — jamais d'evidence / upload. */
export interface TrustDraftPatch {
  orgName?: string;
  country?: string;
  locale?: TrustLocale;
  disclaimerAck?: boolean;
  unpublishedNotes?: string;
}

/**
 * Checklist publication V1 (Chef) :
 * org nommée + ≥1 contrôle attesté + disclaimer.
 * Hors V1 : questionnaires acheteurs.
 */
export interface TrustPublishChecklist {
  orgNamed: boolean;
  hasAttestedControl: boolean;
  disclaimerAck: boolean;
  ready: boolean;
  /** Messages d'erreur FR pour bloquer le publish. */
  errorsFr: string[];
}

export function evaluateTrustPublishChecklist(
  trust: Pick<TrustCenterView, 'org' | 'controls' | 'disclaimerAck'>,
): TrustPublishChecklist {
  const orgNamed = Boolean(trust.org.name?.trim());
  const hasAttestedControl = trust.controls.some((c) => c.status === 'attested');
  const disclaimerAck = Boolean(trust.disclaimerAck);
  const errorsFr: string[] = [];
  if (!orgNamed) {
    errorsFr.push(
      'Organisation non configurée : renseignez un nom d’organisation.',
    );
  }
  if (!hasAttestedControl) {
    errorsFr.push(
      'Au moins un contrôle attesté est requis avant publication.',
    );
  }
  if (!disclaimerAck) {
    errorsFr.push(
      'Vous devez accepter le disclaimer avant de publier le Trust Center.',
    );
  }
  return {
    orgNamed,
    hasAttestedControl,
    disclaimerAck,
    ready: errorsFr.length === 0,
    errorsFr,
  };
}
