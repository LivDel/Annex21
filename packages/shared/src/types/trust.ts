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
  org: {
    slug: string;
    name: string;
    country: string;
  };
  status: TrustStatus;
  locale: TrustLocale;
  controls: TrustControlSummary[];
  attestations: TrustAttestation[];
  unpublishedNotes?: string;
}
