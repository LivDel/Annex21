/**
 * Connecteurs IdP / cloud — collecte de preuves (jamais sur Trust public, RG-08).
 * Secrets chiffrés at-rest (AES-GCM) — jamais loggés.
 */

export type ConnectorProvider = 'entra' | 'google_workspace' | 'aws';

/**
 * États UX grille connecteurs.
 * disconnected | connecting | connected | syncing | error
 */
export type ConnectorState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'error';

export type ConnectorErrorCode = 'CONNECTOR_NO_DATA_EXPORTED' | 'CONNECTOR_AUTH_FAILED' | 'CONNECTOR_SYNC_FAILED';

export interface ConnectorError {
  code: ConnectorErrorCode;
  /** Message FR affiché (ex. « aucune donnée exportée ») */
  message: string;
  retryable: boolean;
}

export interface ConnectorSummary {
  id: string;
  orgId: string;
  provider: ConnectorProvider;
  state: ConnectorState;
  /** Libellé UX — Entra : « lecture journaux d’audit » (jamais Directory.Read.All) */
  scopeLabel: string;
  lastSyncAt?: string;
  error?: ConnectorError;
  /** Evidence historique marquée stale après revoke */
  historicalEvidenceStale?: boolean;
  updatedAt: string;
}

/** Config AWS AssumeRole (pas OAuth user). */
export interface AwsRoleConfig {
  roleArn: string;
  externalId: string;
}

export interface ConnectorConnectRequest {
  /** AWS only */
  roleArn?: string;
  /** OAuth redirect return (stub) */
  redirectUri?: string;
}

export interface ConnectorConnectResponse {
  provider: ConnectorProvider;
  state: ConnectorState;
  /** URL OAuth à ouvrir (Entra / Google) — absent pour AWS */
  authorizationUrl?: string;
  /** AWS : externalId affiché une fois pour la trust policy */
  aws?: { externalId: string; roleArn: string };
}
