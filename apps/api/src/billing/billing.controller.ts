import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AppAuthGuard } from '../common/app-auth.guard';
import { OnboardingGuard } from '../onboarding/onboarding.guard';
import type { AuthedRequest } from '../session/session.guard';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

/**
 * Billing ACV sales-led — SessionGuard (via AppAuthGuard) + OnboardingGuard.
 * Secrets Stripe uniquement côté API (jamais NEXT_PUBLIC_*).
 */
@Controller('billing')
@UseGuards(AppAuthGuard, OnboardingGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('status')
  status(@Req() req: AuthedRequest, @Query('orgId') orgIdQuery?: string) {
    const orgId =
      orgIdQuery?.trim() ||
      req.session?.orgId ||
      'org_acme';
    return this.billing.getStatus(orgId);
  }

  @Post('checkout')
  checkout(@Body() dto: CreateCheckoutDto, @Req() req: AuthedRequest) {
    const orgId = req.session?.orgId || 'org_acme';
    return this.billing.createCheckoutSession(orgId, {
      acvTier: dto.acvTier,
      includeOnboardingFee: dto.includeOnboardingFee,
      onboardingFeeCents: dto.onboardingFeeCents,
      actorUserId: req.user?.id,
    });
  }
}
