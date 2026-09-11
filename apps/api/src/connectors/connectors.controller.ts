import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ConnectorProvider } from '@annex21/shared';
import { AppAuthGuard } from '../common/app-auth.guard';
import { OnboardingGuard } from '../onboarding/onboarding.guard';
import { ConnectorsService } from './connectors.service';
import { ConnectConnectorDto } from './dto/connect.dto';

@Controller('connectors')
export class ConnectorsController {
  constructor(private readonly connectors: ConnectorsService) {}

  @Get()
  @UseGuards(AppAuthGuard, OnboardingGuard)
  list(@Query('orgId') orgId?: string) {
    return this.connectors.list(orgId ?? 'org_acme');
  }

  /**
   * POST /connectors/:provider/connect
   * redirectUri / redirect from body are allowlisted (sanitizeAuthRedirect /
   * AUTH_REDIRECT_ALLOWLIST) — same open-redirect hardening as GET /auth/verify.
   * Arbitrary callback URLs are rejected; OAuth falls back to API callback.
   * Requires server-side onboarding completion (403 ONBOARDING_REQUIRED).
   */
  @Post(':provider/connect')
  @UseGuards(AppAuthGuard, OnboardingGuard)
  connect(
    @Param('provider') provider: ConnectorProvider,
    @Body() dto: ConnectConnectorDto,
  ) {
    return this.connectors.connect(provider, dto.orgId ?? 'org_acme', dto);
  }

  /**
   * OAuth callback stub — peut être appelé sans session (redirect IdP).
   * En MVP : marque connected puis redirige vers /app.
   * Not gated by OnboardingGuard (IdP redirect).
   */
  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: ConnectorProvider,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('orgId') orgId: string | undefined,
    @Res() res: Response,
  ) {
    const org = orgId ?? state ?? 'org_acme';
    await this.connectors.callback(provider, org, code);
    const web = process.env.API_CORS_ORIGIN ?? 'http://localhost:3000';
    res.redirect(302, `${web}/app?connected=${provider}`);
  }

  @Post(':provider/sync')
  @UseGuards(AppAuthGuard, OnboardingGuard)
  sync(
    @Param('provider') provider: ConnectorProvider,
    @Query('orgId') orgId?: string,
    @Body() body?: { forceEmpty?: boolean },
  ) {
    return this.connectors.sync(provider, orgId ?? 'org_acme', body);
  }

  @Post(':provider/revoke')
  @UseGuards(AppAuthGuard, OnboardingGuard)
  revoke(
    @Param('provider') provider: ConnectorProvider,
    @Query('orgId') orgId?: string,
  ) {
    return this.connectors.revoke(provider, orgId ?? 'org_acme');
  }
}
