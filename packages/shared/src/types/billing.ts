/** Stripe ACV billing — sales-led (pas de freemium). Statuts tenant/org. */

export type BillingStatus = 'pending' | 'active' | 'past_due' | 'canceled';

/** Bande ACV devis signé (10 / 20 / 30 k€/an) — pas un price picker freemium. */
export type AcvTier = '10k' | '20k' | '30k';

/** Snapshot billing persisté sur l'org (DomainStore / orgs). */
export interface OrgBilling {
  orgId: string;
  status: BillingStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  /** true si un abonnement / checkout a déjà été initié */
  hasSubscription: boolean;
  updatedAt?: string | null;
}

export interface BillingStatusResponse {
  orgId: string;
  status: BillingStatus;
  hasSubscription: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  updatedAt?: string | null;
}

export interface CreateCheckoutRequest {
  /** Bande ACV du devis signé (sales-led) */
  acvTier: AcvTier;
  /** Inclure fee onboarding one-shot (5–15 k€) — US-BILL02 */
  includeOnboardingFee?: boolean;
  /** Montant fee onboarding en centimes EUR (optionnel ; défaut STRIPE_ONBOARDING_FEE_CENTS) */
  onboardingFeeCents?: number;
}

export interface CreateCheckoutResponse {
  url: string;
  sessionId: string;
}
