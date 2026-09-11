import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AppAuthGuard } from '../common/app-auth.guard';
import type { AuthedRequest } from '../session/session.guard';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { OnboardingService } from './onboarding.service';

/**
 * Server onboarding gate — no Stripe / SSO.
 * GET /me + GET /onboarding/status : status
 * POST /onboarding/complete : org name + NIS2 sector + CISO role
 */
@Controller()
@UseGuards(AppAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('me')
  me(@Req() req: AuthedRequest) {
    return this.onboarding.me(req);
  }

  @Get('onboarding/status')
  status(@Req() req: AuthedRequest) {
    return this.onboarding.statusFor(req);
  }

  @Post('onboarding/complete')
  complete(@Req() req: AuthedRequest, @Body() dto: CompleteOnboardingDto) {
    return this.onboarding.complete(req, dto);
  }
}
