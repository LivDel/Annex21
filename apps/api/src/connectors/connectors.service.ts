import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type {
  ConnectorConnectResponse,
  ConnectorProvider,
  ConnectorSummary,
} from '@annex21/shared';
import { EvidenceService } from '../evidence/evidence.service';
import { encryptSecret } from './secrets.crypto';
import { trySanitizeRedirect } from '../auth/safe-redirect';

/** Scopes Entra : openid offline_access User.Read AuditLog.Read.All — JAMAIS Directory.Read.All */
const ENTRA_SCOPES = ['openid', 'offline_access', 'User.Read', 'AuditLog.Read.All'] as const;

/** Google Workspace lecture seule */
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'https://www.googleapis.com/auth/admin.reports.audit.readonly',
] as const;

const SCOPE_LABELS: Record<ConnectorProvider, string> = {
  entra: 'lecture journaux d’audit',
  google_workspace: 'utilisateurs + journaux d’audit (lecture seule)',
  aws: 'AssumeRole (ExternalId + ARN)',
};

interface ConnectorInternal {
  summary: ConnectorSummary;
  /** Secrets chiffrés — jamais loggés */
  encryptedSecrets?: string;
  staleEvidenceIds: string[];
}

/**
 * Connecteurs MVP — Entra | Google Workspace | AWS AssumeRole.
 * Evidence sync → métadonnées MinIO EU path via EvidenceService (RG-10).
 * Trust public : zéro evidence (RG-07/08).
 */
@Injectable()
export class ConnectorsService {
  private readonly logger = new Logger(ConnectorsService.name);
  private readonly store = new Map<string, ConnectorInternal>();

  constructor(private readonly evidence: EvidenceService) {
    // Seed disconnected cards for demo org
    for (const provider of ['entra', 'google_workspace', 'aws'] as ConnectorProvider[]) {
      this.ensure('org_acme', provider);
    }
  }

  list(orgId = 'org_acme'): ConnectorSummary[] {
    return (['entra', 'google_workspace', 'aws'] as ConnectorProvider[]).map(
      (p) => this.ensure(orgId, p).summary,
    );
  }

  async connect(
    provider: ConnectorProvider,
    orgId: string,
    dto: { roleArn?: string; redirectUri?: string; redirect?: string },
  ): Promise<ConnectorConnectResponse> {
    this.assertProvider(provider);
    const row = this.ensure(orgId, provider);
    row.summary.state = 'connecting';
    row.summary.error = undefined;
    row.summary.updatedAt = new Date().toISOString();

    if (provider === 'aws') {
      if (!dto.roleArn) {
        throw new BadRequestException('roleArn requis pour AWS AssumeRole');
      }
      const prefix = process.env.AWS_EXTERNAL_ID_PREFIX ?? 'annex21';
      const externalId = `${prefix}-${randomBytes(8).toString('hex')}`;
      // Secrets chiffrés at-rest — ne pas logger
      row.encryptedSecrets = encryptSecret(
        JSON.stringify({ roleArn: dto.roleArn, externalId }),
      );
      row.summary.state = 'connected';
      row.summary.updatedAt = new Date().toISOString();
      return {
        provider,
        state: 'connected',
        aws: { roleArn: dto.roleArn, externalId },
      };
    }

    // Open-redirect hardening (same helper / AUTH_REDIRECT_ALLOWLIST as GET /auth/verify):
    // never trust client redirectUri / redirect / callback URL — reject evil.com, //evil,
    // javascript:, etc. Invalid or missing → server-controlled API callback (safe default).
    const clientRedirect = dto.redirectUri ?? dto.redirect;
    const authorizationUrl = this.buildOAuthUrl(provider, orgId, clientRedirect);
    return {
      provider,
      state: 'connecting',
      authorizationUrl,
    };
  }

  /**
   * Callback OAuth stub — marque connected sans échanger de vrai code (MVP).
   */
  async callback(
    provider: ConnectorProvider,
    orgId: string,
    _code?: string,
  ): Promise<ConnectorSummary> {
    this.assertProvider(provider);
    if (provider === 'aws') {
      throw new BadRequestException('AWS n’utilise pas OAuth callback');
    }
    const row = this.ensure(orgId, provider);
    // Placeholder tokens chiffrés — jamais loggés
    row.encryptedSecrets = encryptSecret(
      JSON.stringify({ accessToken: 'stub', refreshToken: 'stub', scopes: provider === 'entra' ? ENTRA_SCOPES : GOOGLE_SCOPES }),
    );
    row.summary.state = 'connected';
    row.summary.error = undefined;
    row.summary.updatedAt = new Date().toISOString();
    return row.summary;
  }

  /**
   * Sync stub — écrit métadonnées evidence vers path MinIO EU.
   * Si aucune donnée : CONNECTOR_NO_DATA_EXPORTED → « aucune donnée exportée » + Retry.
   */
  async sync(
    provider: ConnectorProvider,
    orgId: string,
    opts?: { forceEmpty?: boolean },
  ): Promise<ConnectorSummary> {
    this.assertProvider(provider);
    const row = this.ensure(orgId, provider);
    if (row.summary.state === 'disconnected') {
      throw new BadRequestException('Connecteur non connecté');
    }

    row.summary.state = 'syncing';
    row.summary.updatedAt = new Date().toISOString();

    // Stub : simule absence de données si forceEmpty ou env CONNECTOR_SYNC_EMPTY=true
    const noData =
      opts?.forceEmpty === true || process.env.CONNECTOR_SYNC_EMPTY === 'true';

    if (noData) {
      row.summary.state = 'error';
      row.summary.error = {
        code: 'CONNECTOR_NO_DATA_EXPORTED',
        message: 'aucune donnée exportée',
        retryable: true,
      };
      row.summary.updatedAt = new Date().toISOString();
      return row.summary;
    }

    const filename = `${provider}-audit-export.json`;
    const created = this.evidence.create({
      orgId,
      filename,
      provenance: 'connector',
      controlId: 'c4',
    });
    this.logger.log(
      `Sync ${provider} org=${orgId} → evidence ${created.id} key=${created.storageKey}`,
    );
    // storageKey déjà préfixé eu/ (EvidenceService) — data residency EU

    row.summary.state = 'connected';
    row.summary.lastSyncAt = new Date().toISOString();
    row.summary.error = undefined;
    row.summary.updatedAt = new Date().toISOString();
    row.staleEvidenceIds.push(created.id);
    return row.summary;
  }

  /**
   * Revoke : delete secrets, conserve evidence historique (marquée stale).
   */
  async revoke(provider: ConnectorProvider, orgId: string): Promise<ConnectorSummary> {
    this.assertProvider(provider);
    const row = this.ensure(orgId, provider);
    row.encryptedSecrets = undefined;
    row.summary.state = 'disconnected';
    row.summary.error = undefined;
    row.summary.historicalEvidenceStale = row.staleEvidenceIds.length > 0;
    row.summary.updatedAt = new Date().toISOString();
    // Evidence historique conservée — pas de delete MinIO
    return row.summary;
  }

  private ensure(orgId: string, provider: ConnectorProvider): ConnectorInternal {
    const key = `${orgId}:${provider}`;
    let row = this.store.get(key);
    if (!row) {
      row = {
        summary: {
          id: `conn_${orgId}_${provider}`,
          orgId,
          provider,
          state: 'disconnected',
          scopeLabel: SCOPE_LABELS[provider],
          updatedAt: new Date().toISOString(),
        },
        staleEvidenceIds: [],
      };
      this.store.set(key, row);
    }
    return row;
  }

  private assertProvider(provider: string): asserts provider is ConnectorProvider {
    if (!['entra', 'google_workspace', 'aws'].includes(provider)) {
      throw new NotFoundException(`Provider inconnu: ${provider}`);
    }
  }

  private buildOAuthUrl(
    provider: 'entra' | 'google_workspace',
    orgId: string,
    redirectUri?: string,
  ): string {
    const apiOrigin =
      process.env.API_PUBLIC_URL ??
      `http://localhost:${process.env.API_PORT ?? 3001}`;
    // Safe default = our API OAuth callback (not an arbitrary client URL).
    const safeDefault = `${apiOrigin}/connectors/${provider}/callback?orgId=${encodeURIComponent(orgId)}`;
    // Reuse auth allowlist: only relative `/…` or AUTH_REDIRECT_ALLOWLIST origins.
    const callback = trySanitizeRedirect(redirectUri) ?? safeDefault;

    if (provider === 'entra') {
      // Commentaire : scopes sans Directory.Read.All — UX « lecture journaux d’audit »
      const tenant = process.env.ENTRA_TENANT_ID ?? 'common';
      const clientId = process.env.ENTRA_CLIENT_ID ?? 'stub-client-id';
      const scope = ENTRA_SCOPES.join(' ');
      return (
        `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code&scope=${encodeURIComponent(scope)}` +
        `&redirect_uri=${encodeURIComponent(callback)}` +
        `&state=${encodeURIComponent(orgId)}`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID ?? 'stub-google-client';
    const scope = GOOGLE_SCOPES.join(' ');
    return (
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code&access_type=offline&prompt=consent` +
      `&scope=${encodeURIComponent(scope)}` +
      `&redirect_uri=${encodeURIComponent(callback)}` +
      `&state=${encodeURIComponent(orgId)}`
    );
  }
}
