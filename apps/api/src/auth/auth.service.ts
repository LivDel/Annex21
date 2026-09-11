import { Injectable } from '@nestjs/common';
import type { MagicLinkRequestResponse, MagicLinkVerifyResponse } from '@annex21/shared';

/**
 * Auth magic-link STUB — aucun envoi d'email, aucun JWT réel.
 * SSO SAML/OIDC + MFA Owner (RG-14) hors de ce stub.
 */
@Injectable()
export class AuthService {
  requestMagicLink(email: string): MagicLinkRequestResponse {
    const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';
    return {
      ok: true,
      message: `Lien magique (stub) accepté pour ${email}. Aucun e-mail n'est envoyé en MVP.`,
      ...(isDev
        ? { devToken: process.env.AUTH_STUB_TOKEN ?? 'annex21-dev-stub' }
        : {}),
    };
  }

  verifyMagicLink(_token: string): MagicLinkVerifyResponse {
    return {
      ok: true,
      accessToken: process.env.AUTH_STUB_TOKEN ?? 'annex21-dev-stub',
      user: {
        id: 'usr_stub',
        email: 'ciso@acme.example',
        role: 'owner',
      },
    };
  }
}
