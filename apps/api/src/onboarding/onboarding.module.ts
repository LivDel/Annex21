import { Module } from '@nestjs/common';
import { AuthStubGuard } from '../common/auth-stub.guard';
import { AppAuthGuard } from '../common/app-auth.guard';
import { OrgsModule } from '../orgs/orgs.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingGuard } from './onboarding.guard';
import { OnboardingService } from './onboarding.service';

@Module({
  imports: [OrgsModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    OnboardingGuard,
    AuthStubGuard,
    AppAuthGuard,
  ],
  exports: [OnboardingService, OnboardingGuard],
})
export class OnboardingModule {}
