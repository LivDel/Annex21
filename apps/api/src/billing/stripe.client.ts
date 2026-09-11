import Stripe from 'stripe';

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

export function stripePriceId(): string {
  const id =
    process.env.STRIPE_PRICE_ID?.trim() ||
    process.env.STRIPE_PRODUCT_PRICE_ID?.trim();
  if (!id) {
    throw new Error('STRIPE_PRICE_ID manquant (ACV annuel EUR)');
  }
  return id;
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
