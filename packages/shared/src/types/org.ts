/** Organisation (tenant). Données stockées in-EU (RG-10). */
export interface Organization {
  id: string;
  slug: string;
  name: string;
  /** ISO 3166-1 alpha-2, ICP FR puis DACH */
  country: 'FR' | 'DE' | 'AT' | 'CH';
  createdAt: string;
}

export type MembershipRole = 'owner' | 'contributor' | 'viewer' | 'external';
