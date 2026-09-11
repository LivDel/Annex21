export interface RequestMagicLinkDto {
  email: string;
}

export interface MagicLinkRequestResponse {
  ok: true;
  message: string;
  /** Uniquement en développement — stub MVP, jamais en prod */
  devToken?: string;
}

export interface MagicLinkVerifyResponse {
  ok: true;
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: 'owner' | 'contributor' | 'viewer';
  };
}
