import { Module } from '@nestjs/common';
import { TrustController } from './trust.controller';
import { TrustPublicController } from './trust.public.controller';
import { TrustService } from './trust.service';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';
import { AuditModule } from '../audit/audit.module';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [AuditModule, OnboardingModule],
  controllers: [TrustPublicController, TrustController],
  providers: [TrustService, AuthStubGuard, AppAuthGuard],
  exports: [TrustService],
})
export class TrustModule {}
