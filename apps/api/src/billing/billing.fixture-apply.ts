import type Stripe from 'stripe';
import { ForbiddenException, Logger } from '@nestjs/common';
import type { DomainStore } from '../store/domain-store';
import {
  assertBillingWebhookFixturesAllowed,
  billingWebhookFixturesEnabled,
} from './billing-webhook-fixtures';

const logger = new Logger('BillingFixtureApply');

/**
 * Dev-only: claimWebhookEvent + dispatch through the same handlers as signed webhooks.
 * Fail-closed when NODE_ENV=production (even if BILLING_WEBHOOK_FIXTURES=1).
 */
export async function applyBillingFixtureEvent(
  store: DomainStore,
  dispatchEvent: (event: Stripe.Event) => Promise<void>,
  event: Stripe.Event,
): Promise<{ received: true; duplicate?: boolean }> {
  assertBillingWebhookFixturesAllowed();
  if (!billingWebhookFixturesEnabled()) {
    throw new ForbiddenException('Billing webhook fixtures disabled');
  }

  const claimed = await store.claimWebhookEvent(event.id, event.type, null);
  if (!claimed) {
    logger.debug(`Fixture webhook déjà traité: ${event.id}`);
    return { received: true, duplicate: true };
  }

  await dispatchEvent(event);
  return { received: true };
}
