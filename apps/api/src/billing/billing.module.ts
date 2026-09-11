import { Module } from '@nestjs/common';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { SessionModule } from '../session/session.module';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing.webhook.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [SessionModule, OnboardingModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [BillingService, AuthStubGuard, AppAuthGuard],
  exports: [BillingService],
})
export class BillingModule {}
