import {
  encryptSecret as encryptConnectorSecret,
  decryptSecret as decryptConnectorSecret,
} from '../connectors/secrets.crypto';

/**
 * AES-256-GCM for IdP client secrets at rest.
 * Uses SSO_SECRETS_KEY if set, else CONNECTOR_SECRETS_KEY (same derive logic via env swap).
 */
export function encryptIdpSecret(plaintext: string): string {
  const prev = process.env.CONNECTOR_SECRETS_KEY;
  if (process.env.SSO_SECRETS_KEY) {
    process.env.CONNECTOR_SECRETS_KEY = process.env.SSO_SECRETS_KEY;
  }
  try {
    return encryptConnectorSecret(plaintext);
  } finally {
    if (process.env.SSO_SECRETS_KEY) {
      if (prev === undefined) delete process.env.CONNECTOR_SECRETS_KEY;
      else process.env.CONNECTOR_SECRETS_KEY = prev;
    }
  }
}

export function decryptIdpSecret(payload: string): string {
  const prev = process.env.CONNECTOR_SECRETS_KEY;
  if (process.env.SSO_SECRETS_KEY) {
    process.env.CONNECTOR_SECRETS_KEY = process.env.SSO_SECRETS_KEY;
  }
  try {
    return decryptConnectorSecret(payload);
  } finally {
    if (process.env.SSO_SECRETS_KEY) {
      if (prev === undefined) delete process.env.CONNECTOR_SECRETS_KEY;
      else process.env.CONNECTOR_SECRETS_KEY = prev;
    }
  }
}
