import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppAuthGuard } from '../common/app-auth.guard';
import { OnboardingGuard } from '../onboarding/onboarding.guard';
import type { AuthedRequest } from '../session/session.guard';
import { SsoService } from './sso.service';
import { UpsertIdpDto } from './dto/upsert-idp.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

/**
 * Owner/Admin SSO wizard + members mapping.
 * Roles CDC: owner|admin|member|viewer — no JIT admin.
 */
@Controller('orgs/:orgId/sso')
@UseGuards(AppAuthGuard, OnboardingGuard)
export class SsoAdminController {
  constructor(private readonly sso: SsoService) {}

  @Get('idp')
  getIdp(@Param('orgId') orgId: string) {
    return this.sso.getIdp(orgId);
  }

  @Put('idp')
  upsertIdp(
    @Param('orgId') orgId: string,
    @Body() dto: UpsertIdpDto,
    @Req() req: AuthedRequest,
  ) {
    this.sso.assertOwnerOrAdmin(req.user?.role);
    return this.sso.upsertIdp(orgId, dto);
  }

  @Post('idp/test')
  testIdp(@Param('orgId') orgId: string, @Req() req: AuthedRequest) {
    this.sso.assertOwnerOrAdmin(req.user?.role);
    return this.sso.testIdp(orgId);
  }

  @Post('idp/revoke')
  revokeIdp(@Param('orgId') orgId: string, @Req() req: AuthedRequest) {
    this.sso.assertOwnerOrAdmin(req.user?.role);
    return this.sso.revokeIdp(orgId);
  }

  @Get('members')
  listMembers(@Param('orgId') orgId: string) {
    return this.sso.listMembers(orgId);
  }

  @Patch('members/:memberId')
  updateRole(
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: AuthedRequest,
  ) {
    this.sso.assertOwnerOrAdmin(req.user?.role);
    return this.sso.updateMemberRole(orgId, memberId, dto.role);
  }
}
