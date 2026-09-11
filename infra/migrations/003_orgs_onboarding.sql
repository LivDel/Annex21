-- Annex21 — Orgs + onboarding server gate (Étape 1/2)
-- Architecte GO: orgs.onboarding_completed_at is source of truth (Postgres in-EU, RG-10).
-- Gate: connectors / assessments / incidents / trust writes → 403 ONBOARDING_REQUIRED.
-- Exempt: auth, onboarding, public trust GET.

BEGIN;

CREATE TABLE IF NOT EXISTS orgs (
  id                        TEXT PRIMARY KEY,
  slug                      TEXT NOT NULL UNIQUE,
  name                      TEXT NOT NULL,
  country                   TEXT NOT NULL DEFAULT 'FR'
                            CHECK (country IN ('FR', 'DE', 'AT', 'CH')),
  nis2_sector               TEXT,
  ciso_role                 TEXT
                            CHECK (ciso_role IS NULL OR ciso_role IN ('ciso', 'contributor', 'viewer')),
  onboarding_completed_at   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orgs_onboarding_completed
  ON orgs (onboarding_completed_at)
  WHERE onboarding_completed_at IS NOT NULL;

COMMIT;
