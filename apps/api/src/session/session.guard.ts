import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from './session.service';
import type { SessionRecord } from '@annex21/shared';

export type AuthedRequest = Request & {
  session?: SessionRecord;
  user?: SessionRecord['user'];
};

/**
 * Valide le cookie de session opaque contre Redis (in-EU).
 * Remplace AuthStubGuard sur les routes protégées en chemin prod.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const cookieName = this.sessions.cookieName();
    const sessionId =
      (req.cookies?.[cookieName] as string | undefined) ??
      this.parseCookieHeader(req.headers.cookie, cookieName);

    if (!sessionId) {
      throw new UnauthorizedException('Session requise');
    }

    const record = await this.sessions.get(sessionId);
    if (!record) {
      throw new UnauthorizedException('Session invalide ou expirée');
    }

    req.session = record;
    req.user = record.user;
    return true;
  }

  private parseCookieHeader(
    header: string | undefined,
    name: string,
  ): string | undefined {
    if (!header) return undefined;
    const parts = header.split(';');
    for (const part of parts) {
      const [k, ...rest] = part.trim().split('=');
      if (k === name) return decodeURIComponent(rest.join('='));
    }
    return undefined;
  }
}
