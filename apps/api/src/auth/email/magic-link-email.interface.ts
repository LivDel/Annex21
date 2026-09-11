export const MAGIC_LINK_EMAIL = Symbol('MAGIC_LINK_EMAIL');

export interface MagicLinkEmailPayload {
  to: string;
  magicLinkUrl: string;
  ttlMinutes: number;
}

export interface MagicLinkEmailService {
  sendMagicLink(payload: MagicLinkEmailPayload): Promise<void>;
}
