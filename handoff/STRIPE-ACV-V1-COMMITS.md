# Suggested commits — feat/stripe-acv-billing

Parent agent : créer la branche `feat/stripe-acv-billing`, committer. **Ne pas push depuis l’executor.**

## Suggested commit sequence

1. **shared: BillingStatus + OrgBilling types + audit billing.***  
   `packages/shared/src/types/billing.ts`, `org.ts`, `audit.ts`, `index.ts`

2. **api: DomainStore billing (Postgres + memory) + migration 004**  
   `infra/migrations/004_billing_stripe.sql`, `apps/api/src/db/migrate.ts`, `store/*`

3. **api: Stripe Checkout Sessions + signed webhooks (raw body)**  
   `apps/api/src/billing/**`, `main.ts` (`rawBody: true`), `app.module.ts`, `package.json` (stripe), `.env.example`

4. **web: /app/billing UI (empty, badges, Réessayer) + nav + RequireOnboarding soft note**  
   `apps/web/app/app/billing/**`, `components/billing/**`, `app-shell.tsx`, `lib/app-api.ts`, `require-onboarding.tsx`

5. **docs: US-stripe-acv-v1 + handoff**  
   `US-stripe-acv-v1.md`, `handoff/STRIPE-ACV-V1-COMMITS.md`

## Key files

| Area | Files |
|------|--------|
| API | `billing.service.ts`, `billing.controller.ts`, `billing.webhook.controller.ts`, `stripe.client.ts` |
| Store | `getBilling` / `upsertBilling` / `claimWebhookEvent` |
| Web | `billing-panel.tsx`, `billing-status-badge.tsx`, `/app/billing` |
| Secrets | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` — API only; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` optional |

## Stripe patterns used

- Checkout Sessions (`mode: subscription`), not raw PaymentIntents
- `new Stripe(key)` instance (no global `apiKey`)
- Omit `payment_method_types` (dynamic payment methods)
- Webhook: Nest `rawBody: true` + `constructEvent(rawBody, Stripe-Signature, secret)`
- Idempotent handlers via `stripe_webhook_events` / memory Set
- No `STRIPE_SECRET_*` in `NEXT_PUBLIC_*`
