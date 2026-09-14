/** Organisation (tenant). Données stockées in-EU (RG-10). */
import type { BillingStatus } from './billing';

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
  /** ACV billing status (Stripe sales-led) */
  billingStatus?: BillingStatus | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  billingUpdatedAt?: string | null;
}

/** CDC org roles + external buyer. SSO uses OrgMemberRole (no contributor). */
export type MembershipRole = 'owner' | 'admin' | 'member' | 'viewer' | 'external';
