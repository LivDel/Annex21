import type Stripe from 'stripe';

/**
 * Dev-only Stripe webhook fixtures (soft billing smoke).
 *
 * Gate: BILLING_WEBHOOK_FIXTURES=1 AND NODE_ENV !== production (fail-closed).
 * Reuses BillingService.dispatchEvent + DomainStore.claimWebhookEvent —
 * no live Stripe keys; placeholders only.
 */

export const FIXTURE_CUSTOMER_ID = 'cus_annex21_fixture';
export const FIXTURE_SUBSCRIPTION_ID = 'sub_annex21_fixture';
export const FIXTURE_DEFAULT_ORG_ID = 'org_acme';

/** Canonical event id suffixes (stable replay / idempotency). */
export const FIXTURE_EVENT_KEYS = [
  'checkout_session_completed',
  'invoice_paid',
  'invoice_payment_failed',
  'subscription_deleted',
] as const;

export type FixtureEventKey = (typeof FIXTURE_EVENT_KEYS)[number];

export type FixtureStepResult = {
  key: FixtureEventKey;
  eventId: string;
  eventType: string;
  expectedStatus: 'pending' | 'active' | 'past_due' | 'canceled';
  duplicate: boolean;
  statusAfter: string;
};

/**
 * Fail-closed: never enable fixtures in production, even if the flag is set.
 */
export function billingWebhookFixturesEnabled(): boolean {
  const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
  if (isProd) return false;
  return process.env.BILLING_WEBHOOK_FIXTURES === '1';
}

export function assertBillingWebhookFixturesAllowed(): void {
  const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
  if (isProd) {
    throw new Error(
      'BILLING_WEBHOOK_FIXTURES interdit en production (fail-closed)',
    );
  }
  if (process.env.BILLING_WEBHOOK_FIXTURES !== '1') {
    throw new Error(
      'BILLING_WEBHOOK_FIXTURES=1 requis pour les fixtures webhook (dev only)',
    );
  }
}

export function fixtureEventId(key: FixtureEventKey, runId?: string): string {
  const suffix = runId?.trim() ? `_${runId.trim()}` : '';
  return `evt_annex21_fixture${suffix}_${key}`;
}

function baseEvent(
  id: string,
  type: string,
  object: Record<string, unknown>,
): Stripe.Event {
  return {
    id,
    object: 'event',
    api_version: '2025-01-27.acacia',
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: { object: object as Stripe.Event.Data.Object },
  } as Stripe.Event;
}

export function buildCheckoutSessionCompletedEvent(
  orgId: string,
  runId?: string,
): Stripe.Event {
  return baseEvent(
    fixtureEventId('checkout_session_completed', runId),
    'checkout.session.completed',
    {
      id: `cs_test_annex21_fixture${runId ? `_${runId}` : ''}`,
      object: 'checkout.session',
      client_reference_id: orgId,
      customer: FIXTURE_CUSTOMER_ID,
      subscription: FIXTURE_SUBSCRIPTION_ID,
      mode: 'subscription',
      metadata: { orgId, annex21: 'acv', fixture: '1' },
    },
  );
}

export function buildInvoicePaidEvent(
  orgId: string,
  runId?: string,
): Stripe.Event {
  return baseEvent(fixtureEventId('invoice_paid', runId), 'invoice.paid', {
    id: `in_annex21_fixture_paid${runId ? `_${runId}` : ''}`,
    object: 'invoice',
    customer: FIXTURE_CUSTOMER_ID,
    metadata: { orgId, annex21: 'acv', fixture: '1' },
    parent: {
      type: 'subscription_details',
      subscription_details: {
        subscription: FIXTURE_SUBSCRIPTION_ID,
      },
    },
  });
}

export function buildInvoicePaymentFailedEvent(
  orgId: string,
  runId?: string,
): Stripe.Event {
  return baseEvent(
    fixtureEventId('invoice_payment_failed', runId),
    'invoice.payment_failed',
    {
      id: `in_annex21_fixture_failed${runId ? `_${runId}` : ''}`,
      object: 'invoice',
      customer: FIXTURE_CUSTOMER_ID,
      metadata: { orgId, annex21: 'acv', fixture: '1' },
      parent: {
        type: 'subscription_details',
        subscription_details: {
          subscription: FIXTURE_SUBSCRIPTION_ID,
        },
      },
    },
  );
}

/** Stripe type is customer.subscription.deleted (brief: subscription.deleted). */
export function buildSubscriptionDeletedEvent(
  orgId: string,
  runId?: string,
): Stripe.Event {
  return baseEvent(
    fixtureEventId('subscription_deleted', runId),
    'customer.subscription.deleted',
    {
      id: FIXTURE_SUBSCRIPTION_ID,
      object: 'subscription',
      customer: FIXTURE_CUSTOMER_ID,
      status: 'canceled',
      metadata: { orgId, annex21: 'acv', fixture: '1' },
    },
  );
}

export type BuiltFixture = {
  key: FixtureEventKey;
  expectedStatus: 'pending' | 'active' | 'past_due' | 'canceled';
  /** Soft UX hint after this step (Figma 28:2). */
  uxHint: string;
  event: Stripe.Event;
};

/**
 * Ordered soft-billing journey:
 * empty → pending → active(+factures) → past_due(+Réessayer) → canceled→empty soft
 */
export function buildFixtureSequence(
  orgId: string = FIXTURE_DEFAULT_ORG_ID,
  runId?: string,
): BuiltFixture[] {
  return [
    {
      key: 'checkout_session_completed',
      expectedStatus: 'pending',
      uxHint: 'empty→pending (activation en cours)',
      event: buildCheckoutSessionCompletedEvent(orgId, runId),
    },
    {
      key: 'invoice_paid',
      expectedStatus: 'active',
      uxHint: 'active + factures (stub liste)',
      event: buildInvoicePaidEvent(orgId, runId),
    },
    {
      key: 'invoice_payment_failed',
      expectedStatus: 'past_due',
      uxHint: 'past_due + CTA Réessayer',
      event: buildInvoicePaymentFailedEvent(orgId, runId),
    },
    {
      key: 'subscription_deleted',
      expectedStatus: 'canceled',
      uxHint: 'canceled→empty soft',
      event: buildSubscriptionDeletedEvent(orgId, runId),
    },
  ];
}
