import { Injectable, Logger } from '@nestjs/common';
import type {
  MagicLinkEmailPayload,
  MagicLinkEmailService,
} from './magic-link-email.interface';

/**
 * Envoi email via Brevo API (région EU).
 * Env : BREVO_API_KEY, BREVO_SENDER_EMAIL.
 */
@Injectable()
export class BrevoHttpEmailService implements MagicLinkEmailService {
  private readonly logger = new Logger(BrevoHttpEmailService.name);

  async sendMagicLink(payload: MagicLinkEmailPayload): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;
    const sender = process.env.BREVO_SENDER_EMAIL;
    if (!apiKey || !sender) {
      throw new Error('BREVO_API_KEY / BREVO_SENDER_EMAIL manquants');
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: sender, name: 'Annex21' },
        to: [{ email: payload.to }],
        subject: 'Votre lien de connexion Annex21',
        htmlContent: `<p>Bonjour,</p>
<p>Cliquez pour vous connecter (valide ${payload.ttlMinutes} min) :</p>
<p><a href="${payload.magicLinkUrl}">${payload.magicLinkUrl}</a></p>
<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Brevo HTTP ${res.status}`);
      throw new Error(`Brevo send failed: ${res.status} ${body.slice(0, 200)}`);
    }
  }
}
