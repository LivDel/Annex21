/**
 * RG-10 — Data in-EU
 *
 * Postgres, Redis, MinIO, backups et logs applicatifs sensibles doivent
 * rester dans l'Union européenne. Ce fichier documente la contrainte pour
 * les modules qui touchent du stockage tenant.
 *
 * Enforcing draft ≠ public : voir TrustService.getPublicBySlug (404 si draft).
 * Enforcing no raw evidence on public Trust : PublicTrustCenter n'a pas de champ evidence.
 */
export const DATA_RESIDENCY = 'EU' as const;

export function assertEuResidency(): void {
  const region = process.env.DATA_RESIDENCY ?? 'EU';
  if (region !== 'EU') {
    throw new Error(
      `Annex21 refuse un déploiement hors UE (DATA_RESIDENCY=${region}). RG-10.`,
    );
  }
}
