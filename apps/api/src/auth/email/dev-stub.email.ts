import { Injectable, Logger } from '@nestjs/common';
import type {
  MagicLinkEmailPayload,
  MagicLinkEmailService,
} from './magic-link-email.interface';

/**
 * Stub dev si Brevo non configuré — log uniquement, pas d'envoi réel.
 */
@Injectable()
export class MagicLinkEmailServiceDev implements MagicLinkEmailService {
  private readonly logger = new Logger(MagicLinkEmailServiceDev.name);

  async sendMagicLink(payload: MagicLinkEmailPayload): Promise<void> {
    this.logger.log(
      `[STUB EMAIL] magic-link → ${payload.to} | url=${payload.magicLinkUrl} | ttl=${payload.ttlMinutes}m`,
    );
  }
}
