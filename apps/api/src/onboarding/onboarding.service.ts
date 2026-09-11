import { Injectable, UnauthorizedException } from '@nestjs/common';
import type {
  CompleteOnboardingResponse,
  MeResponse,
  OnboardingOrg,
  OnboardingStatus,
} from '@annex21/shared';
import type { AuthedRequest } from '../session/session.guard';
import { SessionService } from '../session/session.service';
import { OrgsService } from '../orgs/orgs.service';
import type { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

/**
 * Server onboarding gate — source of truth: orgs.onboarding_completed_at.
 * Session Redis mirrors completion for fast guards.
 */
@Injectable()
export class OnboardingService {
  constructor(
    private readonly sessions: SessionService,
    private readonly orgs: OrgsService,
  ) {}

  async statusFor(req: AuthedRequest): Promise<OnboardingStatus> {
    const fromSession = this.statusFromSession(req);
    if (fromSession.completed) return fromSession;

    const userId = req.user?.id ?? req.session?.user?.id;
    const orgId =
      req.session?.orgId ??
      (userId ? await this.sessions.getUserOrgId(userId) : null);

    const completedOrg = await this.orgs.findCompletedForHydration(orgId);
    if (completedOrg?.onboardingCompletedAt) {
      const mirror = this.toOnboardingOrg(completedOrg);
      if (req.session?.id) {
        await this.sessions.update(req.session.id, {
          orgId: completedOrg.id,
          onboardingCompletedAt: completedOrg.onboardingCompletedAt,
          org: mirror,
        });
        req.session.orgId = completedOrg.id;
        req.session.onboardingCompletedAt = completedOrg.onboardingCompletedAt;
        req.session.org = mirror;
      }
      if (userId) {
        await this.sessions.setUserOrgId(userId, completedOrg.id);
      }
      return {
        completed: true,
        completedAt: completedOrg.onboardingCompletedAt,
        org: mirror,
        orgId: completedOrg.id,
      };
    }

    return fromSession;
  }

  async me(req: AuthedRequest): Promise<MeResponse> {
    const user = req.user ?? req.session?.user;
    if (!user) {
      throw new UnauthorizedException('Session requise');
    }
    const onboarding = await this.statusFor(req);
    return { user, onboarding };
  }

  async complete(
    req: AuthedRequest,
    dto: CompleteOnboardingDto,
  ): Promise<CompleteOnboardingResponse> {
    const user = req.user ?? req.session?.user;
    if (!user) {
      throw new UnauthorizedException('Session requise');
    }

    const org = await this.orgs.completeOnboarding({
      orgName: dto.orgName,
      nis2Sector: dto.nis2Sector,
      cisoRole: dto.cisoRole,
      orgId: req.session?.orgId ?? (await this.sessions.getUserOrgId(user.id)),
    });

    const mirror: OnboardingOrg = this.toOnboardingOrg(org);
    const completedAt = org.onboardingCompletedAt!;

    await this.sessions.setUserOrgId(user.id, org.id);

    if (req.session?.id) {
      const updated = await this.sessions.update(req.session.id, {
        orgId: org.id,
        onboardingCompletedAt: completedAt,
        org: mirror,
      });
      if (updated) req.session = updated;
    }

    return {
      ok: true,
      onboarding: {
        completed: true,
        completedAt,
        org: mirror,
        orgId: org.id,
      },
    };
  }

  private statusFromSession(req: AuthedRequest): OnboardingStatus {
    const completedAt = req.session?.onboardingCompletedAt ?? null;
    const org = req.session?.org ?? null;
    return {
      completed: Boolean(completedAt),
      completedAt,
      org,
      orgId: req.session?.orgId ?? null,
    };
  }

  private toOnboardingOrg(org: {
    id: string;
    name: string;
    nis2Sector?: string | null;
    cisoRole?: 'ciso' | 'contributor' | 'viewer' | null;
  }): OnboardingOrg {
    return {
      id: org.id,
      name: org.name,
      nis2Sector: org.nis2Sector ?? '',
      cisoRole: org.cisoRole ?? 'ciso',
    };
  }
}
