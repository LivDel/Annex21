export interface RequestMagicLinkDto {
  email: string;
}

export interface MagicLinkRequestResponse {
  ok: true;
  message: string;
  /**
   * Uniquement si BREVO manquant en développement — token pour tests locaux.
   * Jamais renvoyé en production.
   */
  devToken?: string;
}

export interface MagicLinkVerifyResponse {
  ok: true;
  user: {
    id: string;
    email: string;
    role: 'owner' | 'contributor' | 'viewer';
  };
}

export interface LogoutResponse {
  ok: true;
}
