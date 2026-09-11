import {
  Injectable,
  Logger,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import type {
  MagicLinkRequestResponse,
  MagicLinkVerifyResponse,
  SessionUser,
} from '@annex21/shared';
import { RedisService } from '../session/redis.service';
import { SessionService } from '../session/session.service';
import {
  MAGIC_LINK_EMAIL,
  type MagicLinkEmailService,
} from './email/magic-link-email.interface';

const MAGIC_TTL_SECONDS = 15 * 60;
const MAGIC_PREFIX = 'magic:';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly sessions: SessionService,
    @Inject(MAGIC_LINK_EMAIL) private readonly email: MagicLinkEmailService,
  ) {}

  /**
   * Toujours 200 — pas d'énumération d'emails.
   */
  async requestMagicLink(email: string): Promise<MagicLinkRequestResponse> {
    const normalized = email.trim().toLowerCase();
    const token = randomBytes(32).toString('base64url');
    const hash = this.hashToken(token);

    await this.redis.set(
      `${MAGIC_PREFIX}${hash}`,
      JSON.stringify({ email: normalized, createdAt: new Date().toISOString() }),
      MAGIC_TTL_SECONDS,
    );

    const webOrigin = process.env.API_CORS_ORIGIN ?? 'http://localhost:3000';
    const apiOrigin =
      process.env.API_PUBLIC_URL ??
      `http://localhost:${process.env.API_PORT ?? 3001}`;
    // Verify via API (sets cookie) puis redirect web
    const magicLinkUrl = `${apiOrigin}/auth/verify?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(`${webOrigin}/app/onboarding`)}`;

    try {
      await this.email.sendMagicLink({
        to: normalized,
        magicLinkUrl,
        ttlMinutes: 15,
      });
    } catch (err) {
      this.logger.warn(`Envoi magic-link échoué (réponse toujours 200): ${String(err)}`);
    }

    const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';
    const brevoConfigured = Boolean(
      process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL,
    );

    return {
      ok: true,
      message:
        'Si un compte existe pour cet e-mail, un lien de connexion a été envoyé.',
      ...(isDev && !brevoConfigured ? { devToken: token } : {}),
    };
  }

  /**
   * One-shot : consomme le token, crée session Redis, retourne user + sessionId.
   */
  async verifyMagicLink(
    token: string,
  ): Promise<{ response: MagicLinkVerifyResponse; sessionId: string }> {
    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }
    const hash = this.hashToken(token);
    const raw = await this.redis.getDel(`${MAGIC_PREFIX}${hash}`);
    if (!raw) {
      throw new UnauthorizedException('Lien invalide ou expiré');
    }

    let email: string;
    try {
      email = (JSON.parse(raw) as { email: string }).email;
    } catch {
      throw new UnauthorizedException('Lien invalide');
    }

    const user: SessionUser = {
      id: `usr_${createHash('sha256').update(email).digest('hex').slice(0, 16)}`,
      email,
      role: 'owner',
    };

    const { sessionId } = await this.sessions.create(user);

    return {
      sessionId,
      response: { ok: true, user },
    };
  }

  async logout(sessionId: string | undefined): Promise<{ ok: true }> {
    if (sessionId) {
      await this.sessions.destroy(sessionId);
    }
    return { ok: true };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
