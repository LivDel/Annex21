/**
 * Preuve d'audit.
 * RG-08 : jamais sérialisée sur les routes publiques Trust.
 * RG-11 : provenance, hash/version, date de collecte, lien contrôle.
 * Stockage objet : MinIO in-EU (RG-10).
 */
export type EvidenceProvenance = 'manual' | 'connector';

export interface Evidence {
  id: string;
  orgId: string;
  filename: string;
  /** Hash d'intégrité (ex. sha256) — interne, jamais public */
  hash: string;
  provenance: EvidenceProvenance;
  collectedAt: string;
  controlId?: string;
  /** URI interne MinIO — jamais exposé au Trust public */
  storageKey: string;
}
