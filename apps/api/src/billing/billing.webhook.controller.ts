import {
  Controller,
  Headers,
  Post,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';

/**
 * Stripe webhooks — no session auth; Stripe-Signature + raw body verification.
 * Mounted at POST /billing/webhook (idempotent by event.id).
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
}
