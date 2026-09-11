import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

/**
 * Chiffrement AES-256-GCM des secrets connecteurs at-rest.
 * Clé : CONNECTOR_SECRETS_KEY (32 bytes hex ou utf8 dérivé).
 * Ne jamais logger plaintext ni ciphertext déchiffré.
 */
export function encryptSecret(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`;
}

export function decryptSecret(payload: string): string {
  const key = deriveKey();
  const parts = payload.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Format secret invalide');
  }
  const iv = Buffer.from(parts[1], 'base64url');
  const tag = Buffer.from(parts[2], 'base64url');
  const data = Buffer.from(parts[3], 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

function deriveKey(): Buffer {
  const raw = process.env.CONNECTOR_SECRETS_KEY ?? '';
  if (!raw) {
    if ((process.env.NODE_ENV ?? 'development') === 'production') {
      throw new Error('CONNECTOR_SECRETS_KEY requis en production');
    }
    // Dev fallback — déterministe, jamais pour prod
    return createHash('sha256').update('annex21-dev-connector-secrets').digest();
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return createHash('sha256').update(raw).digest();
}
