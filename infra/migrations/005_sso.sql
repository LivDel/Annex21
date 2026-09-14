-- Annex21 — SSO V1 (OIDC Entra/Google + SAML). Un IdP / org. Pas de SCIM / multi-IdP / social.
-- Roles CDC: owner|admin|member|viewer. 1st SSO user = member (zero JIT admin).

BEGIN;

CREATE TABLE IF NOT EXISTS org_identity_providers (
  id                  TEXT PRIMARY KEY,
  org_id              TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  protocol            TEXT NOT NULL
                      CHECK (protocol IN ('oidc', 'saml')),
  provider            TEXT NOT NULL
                      CHECK (provider IN ('entra', 'google', 'saml')),
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'testing', 'connected', 'error', 'revoked')),
  display_name        TEXT NOT NULL,
  issuer              TEXT,
  client_id           TEXT,
  client_secret_enc   TEXT,
  metadata_url        TEXT,
  metadata_xml        TEXT,
  sp_entity_id        TEXT,
  acs_url             TEXT,
  domains             TEXT[] NOT NULL DEFAULT '{}',
  last_error          TEXT,
  tested_at           TIMESTAMPTZ,
  connected_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- V1: at most one non-revoked IdP per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_idp_one_active
  ON org_identity_providers (org_id)
  WHERE status <> 'revoked';

CREATE INDEX IF NOT EXISTS idx_org_idp_org
  ON org_identity_providers (org_id);

CREATE TABLE IF NOT EXISTS org_members (
  id                  TEXT PRIMARY KEY,
  org_id              TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL,
  email               TEXT NOT NULL,
  display_name        TEXT,
  role                TEXT NOT NULL DEFAULT 'member'
                      CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  pending_assignment  BOOLEAN NOT NULL DEFAULT TRUE,
  idp_subject         TEXT,
  idp_id              TEXT REFERENCES org_identity_providers(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, email),
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org
  ON org_members (org_id);

CREATE INDEX IF NOT EXISTS idx_org_members_email
  ON org_members (email);

COMMIT;
