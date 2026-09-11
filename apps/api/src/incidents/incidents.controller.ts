import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppAuthGuard } from '../common/app-auth.guard';
import { OnboardingGuard } from '../onboarding/onboarding.guard';
import type { AuthedRequest } from '../session/session.guard';
import { IncidentsService } from './incidents.service';
import { OpenIncidentDto } from './dto/open-incident.dto';
import { CompleteStepDto } from './dto/complete-step.dto';
import { LinkEvidenceDto } from './dto/link-evidence.dto';

/**
 * Incidents + SLA ANSSI — privé (AppAuthGuard + OnboardingGuard).
 * 403 ONBOARDING_REQUIRED si orgs.onboarding_completed_at absent.
 * Jamais exposé sur /public/trust (RG-07/08).
 */
@Controller('incidents')
@UseGuards(AppAuthGuard, OnboardingGuard)
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Get()
  list(@Query('orgId') orgId?: string) {
    return this.incidents.list(orgId);
  }

  @Get('sla')
  sla(@Query('orgId') orgId?: string) {
    return this.incidents.openSlaCountdowns(orgId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.incidents.getById(id);
  }

  @Post()
  open(@Body() dto: OpenIncidentDto, @Req() req: AuthedRequest) {
    return this.incidents.open(dto, req.user?.id);
  }

  @Post(':id/steps/:stepId/evidence')
  linkEvidence(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: LinkEvidenceDto,
    @Req() req: AuthedRequest,
  ) {
    return this.incidents.linkEvidence(id, stepId, dto.evidenceId, req.user?.id);
  }

  @Post(':id/steps/:stepId/complete')
  completeStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: CompleteStepDto,
    @Req() req: AuthedRequest,
  ) {
    return this.incidents.completeStep(id, stepId, dto.evidenceIds, req.user?.id);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.incidents.close(id, req.user?.id);
  }
}
