import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  BillingStatus,
  BillingStatusResponse,
  CreateCheckoutResponse,
  OrgBilling,
} from '@annex21/shared';
import type Stripe from 'stripe';
import { DOMAIN_STORE, type DomainStore } from '../store/domain-store';
import {
  createStripeClient,
  onboardingFeeCentsDefault,
  stripeAcvPriceId,
  stripeOnboardingPriceId,
  stripeWebhookSecret,
  type AcvTier,
} from './stripe.client';
import { runBillingFixtureSmoke } from './billing.fixture-runner';
import { applyBillingFixtureEvent } from './billing.fixture-apply';

export { BillingService } from './billing.service.body';

/** Re-export keep for Nest module resolution during restore. */
@Injectable()
export class BillingServiceStub {
  constructor(@Inject(DOMAIN_STORE) private readonly store: DomainStore) {}
}
