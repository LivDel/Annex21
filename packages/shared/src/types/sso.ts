/** SSO V1 — OIDC (Entra/Google) + SAML. Pas de SCIM / multi-IdP / social. */

/** CDC org membership roles — IGNORE Figma « Contributor ». */
export type OrgMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export type SsoProtocol = 'oidc' | 'saml';

/** Preset providers for OIDC buttons + SAML custom. */
export type SsoProviderKind = 'entra' | 'google' | 'saml';

export type IdpStatus =
  | 'draft'
  | 'testing'
  | 'connected'
  | 'error'
  | 'revoked';

/** Public IdP summary — never includes client_secret / private keys. */
export interface OrgIdentityProvider {
  id: string;
  orgId: string;
  protocol: SsoProtocol;
  provider: SsoProviderKind;
  status: IdpStatus;
  displayName: string;
  /** OIDC issuer / authority URL */
  issuer?: string | null;
  clientId?: string | null;
  /** True if a secret is stored (never return plaintext). */
  hasClientSecret: boolean;
  metadataUrl?: string | null;
  spEntityId?: string | null;
  acsUrl?: string | null;
  /** Optional email domain allowlist */
  domains: string[];
  lastError?: string | null;
  testedAt?: string | null;
  connectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  email: string;
  displayName?: string | null;
  role: OrgMemberRole;
  /** True when role is still the SSO default (member) and never explicitly assigned. */
  pendingAssignment: boolean;
  idpSubject?: string | null;
  idpId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Login screen — configured IdP buttons only (no social). */
export interface SsoLoginOption {
  idpId: string;
  orgId: string;
  protocol: SsoProtocol;
  provider: SsoProviderKind;
  displayName: string;
  /** Relative start path on API, e.g. /auth/sso/oidc/entra/start?idpId=... */
  startPath: string;
}

export interface SsoLoginOptionsResponse {
  options: SsoLoginOption[];
  /** Always true — magic link remains available. */
  magicLinkAvailable: true;
}

export interface UpsertIdpRequest {
  protocol: SsoProtocol;
  provider: SsoProviderKind;
  displayName?: string;
  issuer?: string;
  clientId?: string;
  /** Plaintext — encrypted at rest; omit to keep existing. */
  clientSecret?: string;
  metadataUrl?: string;
  metadataXml?: string;
  domains?: string[];
}

export interface TestIdpResponse {
  ok: boolean;
  status: IdpStatus;
  message: string;
}

export interface UpdateMemberRoleRequest {
  role: OrgMemberRole;
}
