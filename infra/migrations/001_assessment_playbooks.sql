-- Annex21 — Assessment NIS2 + Playbooks incidents (V1)
-- Postgres in-EU (RG-10). Jamais exposé via /public/trust (RG-07/08).
-- Append-only: audit_events. playbook_templates.body est immutable (nouvelle version = INSERT).

BEGIN;

CREATE TABLE IF NOT EXISTS nis2_assessments (
  id              TEXT PRIMARY KEY,
  org_id          TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('draft', 'completed')),
  answers         JSONB NOT NULL DEFAULT '{}'::jsonb,
  scope_status    TEXT CHECK (scope_status IS NULL OR scope_status IN ('in_scope', 'out_of_scope', 'unclear')),
  maturity_score  SMALLINT CHECK (maturity_score IS NULL OR (maturity_score >= 0 AND maturity_score <= 100)),
  domain_scores   JSONB,
  gaps            JSONB,
  disclaimer_ack  BOOLEAN NOT NULL DEFAULT FALSE,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_nis2_assessments_org ON nis2_assessments (org_id);
CREATE INDEX IF NOT EXISTS idx_nis2_assessments_org_status ON nis2_assessments (org_id, status);

CREATE TABLE IF NOT EXISTS controls (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL,
  code        TEXT NOT NULL,
  domain      TEXT NOT NULL,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'implemented', 'not_applicable')),
  owner       TEXT,
  due_at      TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_controls_org ON controls (org_id);

-- Templates FR-ANSSI versionnés ; body jsonb immutable (ne pas UPDATE body).
CREATE TABLE IF NOT EXISTS playbook_templates (
  id          TEXT PRIMARY KEY,
  version     TEXT NOT NULL,
  name        TEXT NOT NULL,
  body        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, version)
);

CREATE TABLE IF NOT EXISTS incidents (
  id                     TEXT PRIMARY KEY,
  org_id                 TEXT NOT NULL,
  playbook_template_id   TEXT NOT NULL REFERENCES playbook_templates (id),
  title                  TEXT NOT NULL,
  status                 TEXT NOT NULL CHECK (status IN ('open', 'closed')),
  opened_at              TIMESTAMPTZ NOT NULL,
  due_24h_at             TIMESTAMPTZ NOT NULL,
  due_72h_at             TIMESTAMPTZ NOT NULL,
  due_1m_at              TIMESTAMPTZ NOT NULL,
  closed_at              TIMESTAMPTZ,
  created_by             TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_org ON incidents (org_id);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON incidents (org_id, status);

CREATE TABLE IF NOT EXISTS incident_steps (
  id                  TEXT PRIMARY KEY,
  incident_id         TEXT NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
  template_step_id    TEXT NOT NULL,
  sort_order          INTEGER NOT NULL,
  window              TEXT NOT NULL CHECK (window IN ('24h', '72h', '1m')),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  owner_role          TEXT NOT NULL CHECK (owner_role IN ('owner', 'contributor')),
  requires_evidence   BOOLEAN NOT NULL DEFAULT FALSE,
  status              TEXT NOT NULL CHECK (status IN ('pending', 'done', 'skipped')),
  completed_at        TIMESTAMPTZ,
  completed_by        TEXT
);

CREATE INDEX IF NOT EXISTS idx_incident_steps_incident ON incident_steps (incident_id);

CREATE TABLE IF NOT EXISTS incident_step_evidence (
  id                TEXT PRIMARY KEY,
  incident_step_id  TEXT NOT NULL REFERENCES incident_steps (id) ON DELETE CASCADE,
  evidence_id       TEXT NOT NULL,
  linked_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_by         TEXT,
  UNIQUE (incident_step_id, evidence_id)
);

CREATE INDEX IF NOT EXISTS idx_incident_step_evidence_step ON incident_step_evidence (incident_step_id);
CREATE INDEX IF NOT EXISTS idx_incident_step_evidence_ev ON incident_step_evidence (evidence_id);

-- Append-only : pas de UPDATE/DELETE applicatif.
CREATE TABLE IF NOT EXISTS audit_events (
  id              TEXT PRIMARY KEY,
  org_id          TEXT NOT NULL,
  actor_user_id   TEXT,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT NOT NULL,
  payload         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_org_created ON audit_events (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events (entity_type, entity_id);

COMMIT;
