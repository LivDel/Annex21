import { Injectable } from '@nestjs/common';
import type Stripe from 'stripe';
import { BillingServiceCore } from './billing.service.core';
import { runBillingFixtureSmoke } from './billing.fixture-runner';
import { applyBillingFixtureEvent } from './billing.fixture-apply';

/**
 * Stripe ACV billing — Checkout + signed webhooks + dev fixture smoke.
 */
@Injectable()
export class BillingService extends BillingServiceCore {
  /**
   * Dev-only: apply a synthetic Stripe.Event through claimWebhookEvent + dispatchEvent.
   * Fail-closed when NODE_ENV=production (even if BILLING_WEBHOOK_FIXTURES=1).
   */
  async applyFixtureEvent(
    event: Stripe.Event,
  ): Promise<{ received: true; duplicate?: boolean }> {
    return applyBillingFixtureEvent(
      this.store,
      (e) => this.dispatchEvent(e),
      event,
    );
  }

  /**
   * Soft-billing smoke sequence (empty→pending→active→past_due→canceled).
   * Replays the same event ids a second time to assert idempotent claimWebhookEvent.
   */
  async runFixtureSmoke(opts?: {
    orgId?: string;
    runId?: string;
  }) {
    return runBillingFixtureSmoke(this, opts);
  }
}
