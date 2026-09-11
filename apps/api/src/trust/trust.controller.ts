import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppAuthGuard } from '../common/app-auth.guard';
import { OnboardingGuard } from '../onboarding/onboarding.guard';
import { PublishTrustDto } from './dto/publish-trust.dto';
import { PatchTrustDraftDto } from './dto/patch-trust-draft.dto';
import { TrustService } from './trust.service';

/**
 * Contrôleur authentifié du Trust Center (session Redis ou stub dev).
 * GET draft/checklist : AppAuth only (read).
 * Write routes (PATCH/publish/unpublish) : + OnboardingGuard → 403 ONBOARDING_REQUIRED.
 * Public GET /public/trust exempt (autre controller).
 */
@Controller('trust')
@UseGuards(AppAuthGuard)
export class TrustController {
  constructor(private readonly trust: TrustService) {}

  @Get(':orgSlug')
  getOne(@Param('orgSlug') orgSlug: string) {
    return this.trust.getAuthenticated(orgSlug);
  }

  @Get(':orgSlug/checklist')
  getChecklist(@Param('orgSlug') orgSlug: string) {
    return this.trust.checklist(orgSlug);
  }

  @Patch(':orgSlug')
  @UseGuards(OnboardingGuard)
  patchDraft(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: PatchTrustDraftDto,
    @Req() req: { user?: { id?: string } },
  ) {
    return this.trust.patchDraft(orgSlug, dto, req.user?.id);
  }

  @Post(':orgSlug/publish')
  @UseGuards(OnboardingGuard)
  publish(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: PublishTrustDto,
    @Req() req: { user?: { id?: string } },
  ) {
    return this.trust.publish(orgSlug, dto.disclaimer_ack, req.user?.id);
  }

  @Post(':orgSlug/unpublish')
  @UseGuards(OnboardingGuard)
  unpublish(
    @Param('orgSlug') orgSlug: string,
    @Req() req: { user?: { id?: string } },
  ) {
    return this.trust.unpublish(orgSlug, req.user?.id);
  }
}
