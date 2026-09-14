import { Inject, Injectable, Logger } from '@nestjs/common';
import { Issuer, generators, type Client } from 'openid-client';
import { randomBytes } from 'crypto';
import { RedisService } from '../session/redis.service';
import { decryptIdpSecret } from './idp-secrets.crypto';
import { DOMAIN_STORE, type DomainStore } from '../store/domain-store';

const STATE_PREFIX = 'sso_oidc:';
const STATE_TTL = 10 * 60;

export interface OidcStartResult {
  authorizationUrl: string;
  state: string;
}

export interface OidcCallbackResult {
  email: string;
  subject: string;
  displayName?: string;
  orgId: string;
  idpId: string;
  redirect?: string;
}

@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);

  constructor(
    private readonly redis: RedisService,
    @Inject(DOMAIN_STORE) private readonly store: DomainStore,
  ) {}

  async start(input: {
    idpId: string;
    orgId: string;
    issuer: string;
    clientId: string;
    clientSecretEnc: string;
    redirectUri: string;
    provider: 'entra' | 'google' | 'saml';
    redirect?: string;
  }): Promise<OidcStartResult> {
    const client = await this.buildClient(input);
    const state = generators.state();
    const nonce = generators.nonce();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    // Never store clientSecretEnc / plaintext secrets in Redis OIDC state
    await this.redis.set(
      `${STATE_PREFIX}${state}`,
      JSON.stringify({
        idpId: input.idpId,
        orgId: input.orgId,
        nonce,
        codeVerifier,
        redirect: input.redirect,
        redirectUri: input.redirectUri,
        issuer: input.issuer,
        clientId: input.clientId,
        provider: input.provider,
      }),
      STATE_TTL,
    );

    const scopes =
      input.provider === 'google'
        ? 'openid email profile'
        : 'openid email profile offline_access';

    const authorizationUrl = client.authorizationUrl({
      scope: scopes,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return { authorizationUrl, state };
  }

  async handleCallback(input: {
    state: string;
    code?: string;
    error?: string;
  }): Promise<OidcCallbackResult> {
    if (input.error) {
      throw Object.assign(new Error('access_denied'), { code: 'access_denied' });
    }
    if (!input.state || !input.code) {
      throw Object.assign(new Error('invalid_state'), { code: 'invalid_state' });
    }

    const raw = await this.redis.getDel(`${STATE_PREFIX}${input.state}`);
    if (!raw) {
      throw Object.assign(new Error('invalid_state'), { code: 'invalid_state' });
    }

    let saved: {
      idpId: string;
      orgId: string;
      nonce: string;
      codeVerifier: string;
      redirect?: string;
      redirectUri: string;
      issuer: string;
      clientId: string;
      provider: 'entra' | 'google' | 'saml';
    };
    try {
      saved = JSON.parse(raw);
    } catch {
      throw Object.assign(new Error('invalid_state'), { code: 'invalid_state' });
    }

    try {
      const idp = await this.store.getIdpById(saved.idpId);
      if (!idp?.clientSecretEnc) {
        throw Object.assign(new Error('config_incomplete'), {
          code: 'config_incomplete',
        });
      }

      const client = await this.buildClient({
        issuer: saved.issuer,
        clientId: saved.clientId,
        clientSecretEnc: idp.clientSecretEnc,
        redirectUri: saved.redirectUri,
        provider: saved.provider,
        idpId: saved.idpId,
        orgId: saved.orgId,
      });

      const tokenSet = await client.callback(
        saved.redirectUri,
        { state: input.state, code: input.code },
        {
          state: input.state,
          nonce: saved.nonce,
          code_verifier: saved.codeVerifier,
        },
      );

      const claims = tokenSet.claims();
      const email = (
        (claims.email as string | undefined) ||
        (claims.preferred_username as string | undefined) ||
        ''
      )
        .trim()
        .toLowerCase();
      if (!email || !email.includes('@')) {
        throw Object.assign(new Error('oidc_claims'), { code: 'oidc_claims' });
      }

      return {
        email,
        subject: String(claims.sub),
        displayName:
          (claims.name as string | undefined) ||
          (claims.given_name as string | undefined),
        orgId: saved.orgId,
        idpId: saved.idpId,
        redirect: saved.redirect,
      };
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (
        code === 'oidc_claims' ||
        code === 'access_denied' ||
        code === 'config_incomplete'
      ) {
        throw err;
      }
      this.logger.warn(`OIDC callback failed: ${String(err)}`);
      throw Object.assign(new Error('oidc_exchange'), { code: 'oidc_exchange' });
    }
  }

  /** Soft discovery probe for wizard « Tester la connexion ». */
  async probe(input: {
    issuer: string;
    clientId: string;
    clientSecret?: string;
  }): Promise<{ ok: boolean; message: string }> {
    try {
      const issuer = await Issuer.discover(normalizeIssuer(input.issuer));
      if (!issuer.metadata.authorization_endpoint) {
        return { ok: false, message: 'Issuer sans authorization_endpoint' };
      }
      // Build client to validate secret shape (no network token call in V1 probe)
      new issuer.Client({
        client_id: input.clientId,
        client_secret: input.clientSecret || 'probe',
        redirect_uris: ['http://localhost/callback'],
        response_types: ['code'],
      });
      return { ok: true, message: 'Découverte OIDC réussie' };
    } catch (err) {
      this.logger.warn(`OIDC probe failed: ${String(err)}`);
      return {
        ok: false,
        message: 'Métadonnées inaccessibles ou issuer invalide',
      };
    }
  }

  private async buildClient(input: {
    issuer: string;
    clientId: string;
    clientSecretEnc: string;
    redirectUri: string;
    provider: string;
    idpId: string;
    orgId: string;
  }): Promise<Client> {
    const secret = decryptIdpSecret(input.clientSecretEnc);
    const issuer = await Issuer.discover(normalizeIssuer(input.issuer));
    return new issuer.Client({
      client_id: input.clientId,
      client_secret: secret,
      redirect_uris: [input.redirectUri],
      response_types: ['code'],
    });
  }
}

function normalizeIssuer(issuer: string): string {
  const t = issuer.trim().replace(/\/$/, '');
  // Entra tenant GUID → v2.0 authority
  if (/^[0-9a-fA-F-]{36}$/.test(t)) {
    return `https://login.microsoftonline.com/${t}/v2.0`;
  }
  return t;
}

/** Dev stub state helper (tests). */
export function newOpaqueState(): string {
  return randomBytes(24).toString('base64url');
}
