-- Annex21 — Stripe ACV billing (sales-led). Secrets EU only (RG-10 / RG-16).
-- billing_status on orgs + webhook idempotency table.

BEGIN;

ALTER TABLE orgs
  ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (billing_status IN ('pending', 'active', 'past_due', 'canceled')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_updated_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_stripe_customer
  ON orgs (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orgs_billing_status
  ON orgs (billing_status);

-- Idempotent Stripe webhook processing (event.id)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id            TEXT PRIMARY KEY,
  event_type    TEXT NOT NULL,
  org_id        TEXT,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed
  ON stripe_webhook_events (processed_at DESC);

COMMIT;
