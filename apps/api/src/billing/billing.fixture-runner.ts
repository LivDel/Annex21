import type Stripe from 'stripe';
import type { BillingStatusResponse } from '@annex21/shared';
import {
  assertBillingWebhookFixturesAllowed,
  billingWebhookFixturesEnabled,
  buildFixtureSequence,
  FIXTURE_DEFAULT_ORG_ID,
  type FixtureStepResult,
} from './billing-webhook-fixtures';
import { ForbiddenException } from '@nestjs/common';

/** Minimal surface needed from BillingService for fixture smoke. */
export type BillingFixtureHost = {
  applyFixtureEvent(
    event: Stripe.Event,
  ): Promise<{ received: true; duplicate?: boolean }>;
  getStatus(orgId: string): Promise<BillingStatusResponse>;
};

export async function runBillingFixtureSmoke(
  host: BillingFixtureHost,
  opts?: { orgId?: string; runId?: string },
): Promise<{
  orgId: string;
  runId: string | null;
  steps: FixtureStepResult[];
  replay: FixtureStepResult[];
  ok: boolean;
}> {
  assertBillingWebhookFixturesAllowed();
  const orgId = opts?.orgId?.trim() || FIXTURE_DEFAULT_ORG_ID;
  const runId = opts?.runId?.trim() || null;
  const sequence = buildFixtureSequence(orgId, runId ?? undefined);

  const steps: FixtureStepResult[] = [];
  for (const item of sequence) {
    const result = await host.applyFixtureEvent(item.event);
    const status = await host.getStatus(orgId);
    steps.push({
      key: item.key,
      eventId: item.event.id,
      eventType: item.event.type,
      expectedStatus: item.expectedStatus,
      duplicate: Boolean(result.duplicate),
      statusAfter: status.status,
    });
  }

  const replay: FixtureStepResult[] = [];
  for (const item of sequence) {
    const result = await host.applyFixtureEvent(item.event);
    const status = await host.getStatus(orgId);
    replay.push({
      key: item.key,
      eventId: item.event.id,
      eventType: item.event.type,
      expectedStatus: item.expectedStatus,
      duplicate: Boolean(result.duplicate),
      statusAfter: status.status,
    });
  }

  const forwardOk = steps.every(
    (s) => s.statusAfter === s.expectedStatus && !s.duplicate,
  );
  const replayOk = replay.every((s) => s.duplicate === true);
  const final = await host.getStatus(orgId);
  const finalCanceled =
    final.status === 'canceled' && final.hasSubscription === false;

  return {
    orgId,
    runId,
    steps,
    replay,
    ok: forwardOk && replayOk && finalCanceled,
  };
}

export function assertFixturesGate(): void {
  assertBillingWebhookFixturesAllowed();
  if (!billingWebhookFixturesEnabled()) {
    throw new ForbiddenException('Billing webhook fixtures disabled');
  }
}
