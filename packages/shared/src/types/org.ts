/** Organisation (tenant). Données stockées in-EU (RG-10). */
export interface Organization {
  id: string;
  slug: string;
  name: string;
  /** ISO 3166-1 alpha-2, ICP FR puis DACH */
  country: 'FR' | 'DE' | 'AT' | 'CH';
  createdAt: string;
  /** Secteur NIS2 saisi à l'Étape 1/2 */
  nis2Sector?: string | null;
  /** Rôle métier onboarding (CISO / contributor / viewer) */
  cisoRole?: 'ciso' | 'contributor' | 'viewer' | null;
  /** ISO — set when Étape 1/2 completed (server gate source of truth) */
  onboardingCompletedAt?: string | null;
}

export type MembershipRole = 'owner' | 'contributor' | 'viewer' | 'external';
