-- Annex21 — Trust editor V1 (draft ≠ public, checklist publish)
-- Postgres in-EU (RG-10). Contenu draft jamais exposé via /public/trust (RG-07).
-- Pas de colonnes evidence / storageKey / hash (RG-08).

BEGIN;

CREATE TABLE IF NOT EXISTS trust_centers (
  org_id              TEXT PRIMARY KEY,
  org_slug            TEXT NOT NULL UNIQUE,
  org_name            TEXT NOT NULL,
  org_country         TEXT NOT NULL DEFAULT 'FR',
  status              TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  locale              TEXT NOT NULL CHECK (locale IN ('fr', 'en', 'de')) DEFAULT 'fr',
  controls            JSONB NOT NULL DEFAULT '[]'::jsonb,
  attestations        JSONB NOT NULL DEFAULT '[]'::jsonb,
  disclaimer_ack      BOOLEAN NOT NULL DEFAULT FALSE,
  unpublished_notes   TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_centers_status ON trust_centers (status);
CREATE INDEX IF NOT EXISTS idx_trust_centers_slug ON trust_centers (org_slug);

COMMIT;
