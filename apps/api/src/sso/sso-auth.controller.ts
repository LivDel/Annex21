import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Body,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SsoService } from './sso.service';
import { OidcService } from './oidc.service';
import { SamlService } from './saml.service';
import { SessionService } from '../session/session.service';
import { ssoFrError } from './fr-errors';

/**
 * Public SSO auth routes — magic link unchanged on AuthController.
 * Cookie session = Redis opaque (existing SessionService).
 */
@Controller('auth/sso')
export class SsoAuthController {
  private readonly logger = new Logger(SsoAuthController.name);

  constructor(
    private readonly sso: SsoService,
    private readonly oidc: OidcService,
    private readonly saml: SamlService,
    private readonly sessions: SessionService,
  ) {}

  /** Login choice — configured IdPs + magic link flag. */
  @Get('options')
  async options() {
    const res = await this.sso.loginOptions();
    if (process.env.NODE_ENV === 'production') {
      return {
        ...res,
        options: res.options.filter((o) => !o.idpId.startsWith('preset_')),
      };
    }
    return res;
  }

  /** OIDC start — Entra / Google. */
  @Get('oidc/start')
  async oidcStart(
    @Query('idpId') idpId: string | undefined,
    @Query('provider') provider: string | undefined,
    @Query('redirect') redirect: string | undefined,
    @Res() res: Response,
  ) {
    try {
      if (process.env.NODE_ENV === 'production' && provider && !idpId) {
        return res.redirect(302, this.sso.callbackErrorRedirect('idp_not_found'));
      }
      const { authorizationUrl } = await this.sso.startOidc({
        idpId,
        provider,
        redirect,
      });
      return res.redirect(302, authorizationUrl);
    } catch (err) {
      const code =
        (err as { code?: string }).code ||
        (err as { response?: { message?: string } })?.response?.message ||
        'generic';
      this.logger.warn(`OIDC start failed: ${String(err)}`);
      return res.redirect(302, this.sso.callbackErrorRedirect(
        typeof code === 'string' && code.length < 40 ? code : 'generic',
      ));
    }
  }

  /** OIDC callback — session + allowlist redirect. */
  @Get('oidc/callback')
  async oidcCallback(
    @Query('state') state: string,
    @Query('code') code: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const claims = await this.oidc.handleCallback({ state, code, error });
      const { sessionId } = await this.sso.completeLogin(claims);
      this.setSessionCookie(res, sessionId);
      return res.redirect(
        302,
        this.sso.callbackSuccessRedirect(claims.redirect),
      );
    } catch (err) {
      const errCode = (err as { code?: string }).code ?? 'oidc_exchange';
      this.logger.warn(`OIDC callback failed: ${String(err)}`);
      return res.redirect(302, this.sso.callbackErrorRedirect(errCode));
    }
  }

  /** SAML start */
  @Get('saml/start')
  async samlStart(
    @Query('idpId') idpId: string,
    @Query('redirect') redirect: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const { redirectUrl } = await this.sso.startSaml({ idpId, redirect });
      return res.redirect(302, redirectUrl);
    } catch (err) {
      this.logger.warn(`SAML start failed: ${String(err)}`);
      return res.redirect(302, this.sso.callbackErrorRedirect('generic'));
    }
  }

  /** SP metadata XML */
  @Get('saml/metadata')
  async samlMetadata(@Res() res: Response) {
    const xml = await this.sso.spMetadata();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  }

  /** SAML ACS (HTTP-POST) */
  @Post('saml/acs')
  async samlAcs(
    @Body() body: { SAMLResponse?: string; RelayState?: string },
    @Res() res: Response,
  ) {
    try {
      const claims = await this.saml.handleAcs({
        samlResponse: body.SAMLResponse ?? '',
        relayState: body.RelayState,
      });
      const { sessionId } = await this.sso.completeLogin(claims);
      this.setSessionCookie(res, sessionId);
      return res.redirect(
        302,
        this.sso.callbackSuccessRedirect(claims.redirect),
      );
    } catch (err) {
      const errCode = (err as { code?: string }).code ?? 'saml_validate';
      this.logger.warn(`SAML ACS failed: ${String(err)}`);
      return res.redirect(302, this.sso.callbackErrorRedirect(errCode));
    }
  }

  /** Soft FR error helper for clients */
  @Get('error-message')
  errorMessage(@Query('code') code: string) {
    return { code, message: ssoFrError(code) };
  }

  private setSessionCookie(res: Response, sessionId: string): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(this.sessions.cookieName(), sessionId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: this.sessions.ttlSeconds() * 1000,
      path: '/',
    });
  }
}
