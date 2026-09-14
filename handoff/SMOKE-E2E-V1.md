# Annex21 Smoke E2E V1 — Chef report

**Verdict: NO-GO** (against GitHub `main` @ `ea424604b1e7e90319a6f6dce69b3a7931edbaaf`)

**Date:** 2026-09-11  
**Aligned SHA:** `ea424604b1e7e90319a6f6dce69b3a7931edbaaf` (cloned from `LivDel/Annex21` main; local workspace was not a git repo and had drifted — resynced source from that SHA, then applied local smoke fixes).  
**Fix PR opened:** **No** (`gh` not authenticated; no merge performed).

---

## Summary

Upstream `main` @ ea42460 **does not build or boot cleanly**. After local patches (billing DomainStore impl, Tailwind alpha colors, Next page params, mock TrustCenterView fields, AuthModule→OrgsModule), **turbo build passes** and a **memory-mode runtime smoke** covers most Chef checklist items. Until those fixes land on GitHub, ship remains **NO-GO**.

---

## Checklist results

| # | Item | Result | Evidence |
|---|------|--------|----------|
| 1 | Login magic link (stub/session) | **PASS** | `POST /auth/magic-link` → 201 `{ok:true, devToken}` with Brevo unset (dev stub email). |
| 2 | Onboarding (server gate) | **PASS** | Pre-complete: `GET /billing/status` → 403 `ONBOARDING_REQUIRED`. `POST /onboarding/complete` → 201; gate lifts. |
| 3 | Connector / evidence stub | **PASS** | `GET /connectors` gated 403 until onboarded; `GET /evidence` returns stub payloads (no raw trust exposure). |
| 4 | Assessment | **PASS** (gate) | `GET /assessments` → 403 `ONBOARDING_REQUIRED` pre-onboarding; module + `/app/assessment` build present. |
| 5 | Incident / playbook + required evidence | **PASS** (API) | `GET /playbooks/templates` returns FR-ANSSI stub; `GET /incidents` → 200 `[]` post-onboarding; routes for step evidence/complete mapped. |
| 6 | Trust draft / publish / unpublish | **PASS** | Auth `GET /trust/demo-draft` → draft. `POST .../publish` then `GET /public/trust/acme` → 200 published. `POST .../unpublish` → public **404**. |
| 7 | Billing simulated states | **PARTIAL** | Runtime: `GET /billing/status` → `pending` after onboarding (stubs only, no real Stripe). Code+UI cover `pending/active/past_due/canceled` (`BillingStatus`, badges, webhook mappers). Active/past_due/canceled not exercised without webhook fixtures. |
| 8 | Build + unit/typecheck | **PASS** (patched) / **FAIL** (upstream) | `pnpm build` (turbo shared+api+web) **OK after fixes**. `pnpm --filter @annex21/api lint` + shared lint OK. **No `*.spec.ts` / unit tests present.** Upstream api build failed (missing store billing methods); web failed (Tailwind `@apply` opacity + PageProps). |
| 9 | Migrations 001–004 | **PASS** (files) / **SKIP** (apply) | Files present: `001`…`004`. `migrate.ts` applies all `*.sql` lexical. **Docker not installed** — no live `psql` apply (dry-run/SQL verification only). |
| 10 | No draft leak `/public/trust` or `/trust/[org]` | **PASS** | API `GET /public/trust/demo-draft` → **404**. Web `GET /trust/demo-draft` → **404** (no Nordic draft body). Web `GET /public/trust` → **404** (no Next route). Auth preview still returns draft (expected). SSG only `/trust/acme`. |

---

## Key commands & results

```text
# Align
git clone https://github.com/LivDel/Annex21.git  → ea424604…

# Secrets in apps/web
rg STRIPE_SECRET|sk_live|sk_test|whsec_ apps/web  → 0 hits

# Upstream build (before fixes)
pnpm build → FAIL @annex21/api
  MemoryDomainStore/PostgresDomainStore/DomainStoreProxy missing:
  getBilling, upsertBilling, findOrgIdByStripeCustomer, claimWebhookEvent

# After local fixes
pnpm build → Tasks: 3 successful (shared, api, web)
pnpm --filter @annex21/api lint → OK
# Note: nest build sometimes emits only .d.ts under incremental cache;
#   `tsc -p tsconfig.build.json` reliably emits JS (used for runtime smoke).

# Runtime (memory Postgres/Redis fallback, Stripe placeholders only)
node dist/main.js → listening :3001
next start --port 3000 → Ready
POST /auth/magic-link → 201
POST /onboarding/complete → 201
GET /billing/status → 200 pending
POST /trust/acme/publish → 201; GET /public/trust/acme → 200
POST /trust/acme/unpublish → 201; GET /public/trust/acme → 404
GET /trust/demo-draft (web) → 404
```

---

## Failures on upstream main (blockers)

1. **DomainStore billing API incomplete (PR #11)** — interface + `BillingService` call `getBilling` / `upsertBilling` / `findOrgIdByStripeCustomer` / `claimWebhookEvent`, but memory/postgres/proxy never implemented → Nest compile fail.
2. **AuthModule missing `OrgsModule` import** — `AuthService` injects `OrgsService` → DI crash at boot (`Nest can't resolve dependencies`).
3. **Web Tailwind** — `annex.*` colors as CSS vars cannot use `/opacity` in `@apply` / JIT → `next build` fail on `border-annex-mint/40`.
4. **Next 15 PageProps** — `controls` pages used `Promise | sync` unions → typecheck fail.
5. **`MOCK_TRUST_PREVIEW` missing `orgId` / `disclaimerAck`** → typecheck fail.
6. **Seed inconsistency** — API memory seeds `acme` as **draft**; web mock treats `acme` as **published** (SSG). Not a draft-content leak for `demo-draft`, but confusing; prefer seed alignment.

---

## Suggested fixes (local patches already applied under `/workspace/annex21`)

1. Implement billing methods on `memory.domain-store.ts`, `postgres.domain-store.ts`, and delegate in `store.module.ts` DomainStoreProxy (map to `orgs` + `stripe_webhook_events` per `004_billing_stripe.sql`).
2. `AuthModule` → `imports: [OrgsModule]`.
3. Tailwind: define `annex` / `navy` colors with `rgb(... / <alpha-value>)`.
4. Controls pages: `params` / `searchParams` as `Promise<…>` only.
5. Mock preview: add `orgId` + `disclaimerAck`; keep drafts out of `MOCK_PUBLIC_TRUST`.
6. Align memory seed: set demo public org (`novatech` or `acme`) consistently published for public demos.
7. Add webhook fixture tests for billing `active` / `past_due` / `canceled` without live Stripe.
8. CI: prefer `tsc -p tsconfig.build.json` or clear incremental before `nest build`.
9. Open PR with the above once `gh` auth is available — **do not merge from this smoke run**.

---

## Constraints respected

- Stubs/placeholders only (`sk_test_replace_me`, `whsec_replace_me`, `price_replace_me_*`) — no real Stripe/API keys.
- No merge.
- No fix PR opened (auth missing).
