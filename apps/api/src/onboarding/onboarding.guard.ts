import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthedRequest } from '../session/session.guard';
import { OnboardingService } from './onboarding.service';

/**
 * After AppAuthGuard: connectors / assessments / incidents / trust writes
 * return 403 ONBOARDING_REQUIRED if orgs.onboarding_completed_at is unset.
 * Exempt: auth, onboarding (+ GET /me), public trust GET.
 */
@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(private readonly onboarding: OnboardingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const status = await this.onboarding.statusFor(req);
    if (status.completed) return true;

    throw new ForbiddenException({
      statusCode: 403,
      error: 'ONBOARDING_REQUIRED',
      message:
        'Onboarding requis — complétez Étape 1/2 (organisation) avant d’accéder à cette ressource.',
      redirect: '/app/onboarding',
    });
  }
}
