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


function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  const details = parent?.subscription_details;
  if (!details) return null;
  const sub = details.subscription;
  return typeof sub === 'string' ? sub : sub?.id ?? null;
}

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): BillingStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    case 'incomplete':
    case 'paused':
    default:
      return 'pending';
  }
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;

  constructor(@Inject(DOMAIN_STORE) private readonly store: DomainStore) {}

  private client(): Stripe {
    if (!this.stripe) {
      try {
        this.stripe = createStripeClient();
      } catch (e) {
        throw new ServiceUnavailableException(
          (e as Error).message || 'Stripe non configuré',
        );
      }
    }
    return this.stripe;
  }

  async getStatus(orgId: string): Promise<BillingStatusResponse> {
    const billing =
      (await this.store.getBilling(orgId)) ??
      ({
        orgId,
        status: 'pending' as BillingStatus,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        hasSubscription: false,
        updatedAt: null,
      } satisfies OrgBilling);

    return {
      orgId: billing.orgId,
      status: billing.status,
      hasSubscription: billing.hasSubscription,
      stripeCustomerId: billing.stripeCustomerId ?? null,
      stripeSubscriptionId: billing.stripeSubscriptionId ?? null,
      updatedAt: billing.updatedAt ?? null,
    };
  }

  async createCheckoutSession(
    orgId: string,
    opts: {
      acvTier: AcvTier;
      includeOnboardingFee?: boolean;
      onboardingFeeCents?: number;
      actorUserId?: string;
    },
  ): Promise<CreateCheckoutResponse> {
    const stripe = this.client();
    let priceId: string;
    try {
      priceId = stripeAcvPriceId(opts.acvTier);
    } catch (e) {
      throw new ServiceUnavailableException((e as Error).message);
    }

    const webOrigin =
      process.env.NEXT_PUBLIC_WEB_ORIGIN?.trim() ||
      process.env.API_CORS_ORIGIN?.trim() ||
      'http://localhost:3000';

    const existing = await this.store.getBilling(orgId);
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    if (opts.includeOnboardingFee) {
      const onboardingPrice = stripeOnboardingPriceId();
      if (onboardingPrice) {
        lineItems.push({ price: onboardingPrice, quantity: 1 });
      } else {
        const cents = opts.onboardingFeeCents ?? onboardingFeeCentsDefault();
        if (cents < 500_000 || cents > 1_500_000) {
          throw new BadRequestException(
            'Fee onboarding hors plage 5–15 k€ (centimes EUR)',
          );
        }
        lineItems.push({
          price_data: {
            currency: 'eur',
            unit_amount: cents,
            product_data: {
              name: 'Fee onboarding Annex21',
              description: 'Mise en service sales-led (one-shot)',
            },
          },
          quantity: 1,
        });
      }
    }

    // Checkout Sessions pattern — omit payment_method_types (Stripe dynamic).
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${webOrigin}/app/billing?checkout=success`,
      cancel_url: `${webOrigin}/app/billing?checkout=cancel`,
      client_reference_id: orgId,
      metadata: { orgId, annex21: 'acv', acvTier: opts.acvTier },
      subscription_data: {
        metadata: { orgId, annex21: 'acv', acvTier: opts.acvTier },
      },
    };

    if (existing?.stripeCustomerId) {
      sessionParams.customer = existing.stripeCustomerId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) {
      throw new ServiceUnavailableException(
        'Stripe Checkout Session sans URL',
      );
    }

    await this.store.upsertBilling(orgId, {
      status: existing?.status === 'active' ? existing.status : 'pending',
      stripeCustomerId:
        typeof session.customer === 'string'
          ? session.customer
          : existing?.stripeCustomerId ?? null,
    });

    await this.store.appendAudit({
      orgId,
      action: 'billing.checkout_created',
      entityType: 'billing',
      entityId: session.id,
      actorUserId: opts.actorUserId,
      payload: {
        acvTier: opts.acvTier,
        includeOnboardingFee: Boolean(opts.includeOnboardingFee),
        mode: session.mode,
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  /**
   * Verify Stripe-Signature against raw body; process idempotently by event.id.
   */
  async handleWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<{ received: true; duplicate?: boolean }> {
    if (!signature) {
      throw new BadRequestException('Stripe-Signature manquant');
    }
    let secret: string;
    try {
      secret = stripeWebhookSecret();
    } catch (e) {
      throw new ServiceUnavailableException((e as Error).message);
    }

    const stripe = this.client();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      this.logger.warn(`Webhook signature invalide: ${(err as Error).message}`);
      throw new BadRequestException('Signature webhook invalide');
    }

    const claimed = await this.store.claimWebhookEvent(
      event.id,
      event.type,
      null,
    );
    if (!claimed) {
      this.logger.debug(`Webhook déjà traité: ${event.id}`);
      return { received: true, duplicate: true };
    }

    try {
      await this.dispatchEvent(event);
    } catch (e) {
      this.logger.error(
        `Webhook handler error ${event.type}/${event.id}: ${(e as Error).message}`,
      );
      throw e;
    }

    return { received: true };
  }

  private async dispatchEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.onCheckoutCompleted(session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.onInvoicePaid(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.onInvoicePaymentFailed(invoice);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        await this.onSubscriptionChange(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.onSubscriptionDeleted(sub);
        break;
      }
      default:
        this.logger.debug(`Webhook ignoré: ${event.type}`);
    }
  }

  private async resolveOrgId(params: {
    orgIdMeta?: string | null;
    customerId?: string | null;
    clientReferenceId?: string | null;
  }): Promise<string | null> {
    if (params.orgIdMeta) return params.orgIdMeta;
    if (params.clientReferenceId) return params.clientReferenceId;
    if (params.customerId) {
      return this.store.findOrgIdByStripeCustomer(params.customerId);
    }
    return null;
  }

  private async applyStatus(
    orgId: string,
    status: BillingStatus,
    ids: {
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
    },
    eventHint: string,
  ): Promise<void> {
    const before = await this.store.getBilling(orgId);
    const next = await this.store.upsertBilling(orgId, {
      status,
      ...ids,
    });
    if (before?.status !== next.status) {
      await this.store.appendAudit({
        orgId,
        action: 'billing.status_changed',
        entityType: 'billing',
        entityId: orgId,
        payload: {
          from: before?.status ?? null,
          to: next.status,
          event: eventHint,
          stripeCustomerId: next.stripeCustomerId,
          stripeSubscriptionId: next.stripeSubscriptionId,
        },
      });
    }
  }

  private async onCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const customerId =
      typeof session.customer === 'string' ? session.customer : null;
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : null;
    const orgId = await this.resolveOrgId({
      orgIdMeta: session.metadata?.orgId,
      clientReferenceId: session.client_reference_id,
      customerId,
    });
    if (!orgId) {
      this.logger.warn('checkout.session.completed sans orgId');
      return;
    }
    // Pending until invoice.paid / subscription active (US-BILL03)
    await this.applyStatus(
      orgId,
      'pending',
      { stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId },
      'checkout.session.completed',
    );
  }

  private async onInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const customerId =
      typeof invoice.customer === 'string' ? invoice.customer : null;
    const subscriptionId = invoiceSubscriptionId(invoice);
    const orgId = await this.resolveOrgId({
      orgIdMeta: invoice.metadata?.orgId ?? null,
      customerId,
    });
    if (!orgId) {
      this.logger.warn('invoice.paid sans orgId');
      return;
    }
    await this.applyStatus(
      orgId,
      'active',
      { stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId },
      'invoice.paid',
    );
  }

  private async onInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId =
      typeof invoice.customer === 'string' ? invoice.customer : null;
    const subscriptionId = invoiceSubscriptionId(invoice);
    const orgId = await this.resolveOrgId({
      orgIdMeta: invoice.metadata?.orgId ?? null,
      customerId,
    });
    if (!orgId) return;
    await this.applyStatus(
      orgId,
      'past_due',
      { stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId },
      'invoice.payment_failed',
    );
  }

  private async onSubscriptionChange(sub: Stripe.Subscription): Promise<void> {
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : null;
    const orgId = await this.resolveOrgId({
      orgIdMeta: sub.metadata?.orgId,
      customerId,
    });
    if (!orgId) return;
    const status = mapStripeSubscriptionStatus(sub.status);
    await this.applyStatus(
      orgId,
      status,
      { stripeCustomerId: customerId, stripeSubscriptionId: sub.id },
      `customer.subscription.${sub.status}`,
    );
  }

  private async onSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : null;
    const orgId = await this.resolveOrgId({
      orgIdMeta: sub.metadata?.orgId,
      customerId,
    });
    if (!orgId) return;
    await this.applyStatus(
      orgId,
      'canceled',
      { stripeCustomerId: customerId, stripeSubscriptionId: sub.id },
      'customer.subscription.deleted',
    );
  }
}
