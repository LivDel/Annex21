import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';
import { SessionService } from '../session/session.service';
import { sanitizeAuthRedirect } from './safe-redirect';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  /** POST /auth/magic-link — toujours 200 (pas d'énumération). */
  @Post('magic-link')
  request(@Body() dto: RequestMagicLinkDto) {
    return this.auth.requestMagicLink(dto.email);
  }

  /**
   * GET /auth/verify?token= — one-shot, cookie session httpOnly Secure SameSite=Lax.
   * ?redirect= / ?redirectUri= → 302 after allowlist (open-redirect hardening).
   * Invalid/missing redirect → safe default /app. sinon JSON { ok, user }.
   */
  @Get('verify')
  async verify(
    @Query('token') token: string,
    @Query('redirect') redirect: string | undefined,
    @Query('redirectUri') redirectUri: string | undefined,
    @Query('format') format: string | undefined,
    @Res() res: Response,
  ) {
    const { sessionId, response } = await this.auth.verifyMagicLink(token ?? '');

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(this.sessions.cookieName(), sessionId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: this.sessions.ttlSeconds() * 1000,
      path: '/',
    });

    // Open-redirect hardening: never trust arbitrary client redirect / redirectUri.
    // Allow only relative paths starting with `/` (web origin) OR absolute URLs
    // whose origin is in AUTH_REDIRECT_ALLOWLIST (defaults: localhost:3000 + CORS web origin).
    // Reject https://evil.com, //evil.com, javascript:, data:, etc.
    // Invalid/missing → safe default `/app` on the web origin.
    const wantsRedirect =
      format !== 'json' && (redirect !== undefined || redirectUri !== undefined);
    if (wantsRedirect) {
      const safe = sanitizeAuthRedirect(redirect ?? redirectUri);
      return res.redirect(302, safe);
    }

    return res.json(response);
  }

  /** POST /auth/logout — détruit session Redis + clear cookie. */
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const name = this.sessions.cookieName();
    const sessionId =
      (req.cookies?.[name] as string | undefined) ??
      this.readCookie(req.headers.cookie, name);
    await this.auth.logout(sessionId);
    res.clearCookie(name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { ok: true as const };
  }

  private readCookie(header: string | undefined, name: string): string | undefined {
    if (!header) return undefined;
    for (const part of header.split(';')) {
      const [k, ...rest] = part.trim().split('=');
      if (k === name) return decodeURIComponent(rest.join('='));
    }
    return undefined;
  }
}
