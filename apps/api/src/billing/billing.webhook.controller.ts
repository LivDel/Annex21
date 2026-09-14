import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';
import {
  billingWebhookFixturesEnabled,
  buildFixtureSequence,
  FIXTURE_DEFAULT_ORG_ID,
  type FixtureEventKey,
} from './billing-webhook-fixtures';

/**
 * Stripe webhooks — no session auth; Stripe-Signature + raw body verification.
 * Mounted at POST /billing/webhook (idempotent by event.id).
 *
 * Dev-only fixtures: POST /billing/webhook/fixtures (BILLING_WEBHOOK_FIXTURES=1,
 * fail-closed in production) — reuses claimWebhookEvent + same dispatch handlers.
 */
@Controller('billing')
export class BillingWebhookController {
  constructor(private readonly billing: BillingService) {}

  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    const raw = req.rawBody;
    if (!raw || !Buffer.isBuffer(raw)) {
      throw new BadRequestException(
        'Raw body requis pour vérification Stripe-Signature',
      );
    }
    return this.billing.handleWebhook(raw, signature);
  }

  /**
   * Soft billing smoke path — synthetic events, no Stripe signature.
   * Rejected unless BILLING_WEBHOOK_FIXTURES=1 and NODE_ENV !== production.
   */
  @Post('webhook/fixtures')
  async fixtures(
    @Body()
    body?: {
      orgId?: string;
      runId?: string;
      /** single step key, or omit for full sequence smoke */
      step?: FixtureEventKey;
      /** when true, run full sequence + idempotent replay */
      smoke?: boolean;
    },
  ) {
    if (!billingWebhookFixturesEnabled()) {
      throw new ForbiddenException(
        'Billing webhook fixtures disabled (dev only; fail-closed in production)',
      );
    }

    const orgId = body?.orgId?.trim() || FIXTURE_DEFAULT_ORG_ID;
    const runId = body?.runId?.trim();

    if (body?.smoke) {
      return this.billing.runFixtureSmoke({ orgId, runId });
    }

    const sequence = buildFixtureSequence(orgId, runId);
    if (body?.step) {
      const item = sequence.find((s) => s.key === body.step);
      if (!item) {
        throw new BadRequestException(`Unknown fixture step: ${body.step}`);
      }
      const result = await this.billing.applyFixtureEvent(item.event);
      const status = await this.billing.getStatus(orgId);
      return {
        ...result,
        step: item.key,
        eventId: item.event.id,
        eventType: item.event.type,
        status,
        uxHint: item.uxHint,
      };
    }

    const applied = [];
    for (const item of sequence) {
      const result = await this.billing.applyFixtureEvent(item.event);
      const status = await this.billing.getStatus(orgId);
      applied.push({
        key: item.key,
        eventId: item.event.id,
        eventType: item.event.type,
        duplicate: Boolean(result.duplicate),
        status: status.status,
        uxHint: item.uxHint,
      });
    }
    return { orgId, applied };
  }
}
