import Stripe from 'stripe';

export type AcvTier = '10k' | '20k' | '30k';

/**
 * Stripe client factory — instantiate Stripe (not global Stripe.apiKey).
 * Secrets EU only: STRIPE_SECRET_KEY never reaches NEXT_PUBLIC_*.
 */
export function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY manquant (placeholder EU requis — jamais NEXT_PUBLIC_*)',
    );
  }
  // Official Node SDK: omit apiVersion to use the SDK-pinned default.
  return new Stripe(key);
}

/**
 * Resolve Stripe Price id for ACV band (sales-led devis 10 / 20 / 30 k€).
 */
export function stripeAcvPriceId(tier: AcvTier): string {
  const envKey =
    tier === '10k'
      ? 'STRIPE_PRICE_ID_10K'
      : tier === '20k'
        ? 'STRIPE_PRICE_ID_20K'
        : 'STRIPE_PRICE_ID_30K';
  const id = process.env[envKey]?.trim();
  if (!id) {
    throw new Error(`${envKey} manquant (ACV devis ${tier} EUR)`);
  }
  return id;
}

/**
 * @deprecated Use stripeAcvPriceId(tier). Single STRIPE_PRICE_ID is removed.
 */
export function stripePriceId(): never {
  throw new Error(
    'STRIPE_PRICE_ID unique est déprécié — utiliser stripeAcvPriceId(acvTier) + STRIPE_PRICE_ID_10K/20K/30K',
  );
}

/** Optional one-shot onboarding Price id (preferred over price_data). */
export function stripeOnboardingPriceId(): string | null {
  return process.env.STRIPE_PRICE_ID_ONBOARDING?.trim() || null;
}

export function stripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET manquant');
  }
  return secret;
}

/** Fee onboarding optionnel (centimes EUR) — défaut 10_000_00 = 10 k€ */
export function onboardingFeeCentsDefault(): number {
  const raw = process.env.STRIPE_ONBOARDING_FEE_CENTS?.trim();
  if (raw && /^\d+$/.test(raw)) return Number(raw);
  return 1_000_000; // 10_000 EUR
}
