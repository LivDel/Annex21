import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

/**
 * AES-256-GCM for IdP client secrets at rest.
 * Prefers SSO_SECRETS_KEY, else CONNECTOR_SECRETS_KEY.
 * Must NOT mutate process.env (no key swap).
 */
function deriveSsoKey(): Buffer {
  const raw =
    process.env.SSO_SECRETS_KEY || process.env.CONNECTOR_SECRETS_KEY || '';
  if (!raw) {
    if ((process.env.NODE_ENV ?? 'development') === 'production') {
      throw new Error(
        'SSO_SECRETS_KEY ou CONNECTOR_SECRETS_KEY requis en production',
      );
    }
    // Dev fallback — déterministe, jamais pour prod (same as connectors)
    return createHash('sha256').update('annex21-dev-connector-secrets').digest();
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return createHash('sha256').update(raw).digest();
}

export function encryptIdpSecret(plaintext: string): string {
  const key = deriveSsoKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`;
}

export function decryptIdpSecret(payload: string): string {
  const key = deriveSsoKey();
  const parts = payload.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Format secret invalide');
  }
  const iv = Buffer.from(parts[1], 'base64url');
  const tag = Buffer.from(parts[2], 'base64url');
  const data = Buffer.from(parts[3], 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8',
  );
}
