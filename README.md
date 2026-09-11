# Annex21

SaaS mid-market **NIS2-native** (hors finance / DORA en V1) : assessment d’applicabilité, playbooks d’incident nationaux (ANSSI), Trust Center public, collecte de preuves — **data in-EU**.

Monorepo MVP (`pnpm` workspaces + Turbo).

## Résidence des données (UE) — RG-10

**Toute donnée tenant reste dans l’Union européenne.**

| Donnée | Stockage local (dev) | Contrainte prod |
|--------|----------------------|-----------------|
| Organisations, assessments, Trust | Postgres | Région EU uniquement |
| Sessions / magic-links / files d’alertes SLA | Redis | Idem |
| Preuves (evidence) | MinIO | Bucket EU, jamais exposé au Trust public |
| Backups & logs applicatifs sensibles | — | EU only, pas de replica US |

- `infra/docker-compose.yml` porte le label `annex21.data_residency: EU`.
- Le Trust Center public **ne contient jamais** de preuves brutes (RG-08).
- **Draft ≠ public** (RG-07) : `GET /public/trust/:orgSlug` ne renvoie que les Trust **published**.

Ne pas pointer `POSTGRES_*`, Redis ou MinIO vers un cloud hors UE en production.

## Auth (magic-link + sessions Redis)

- `POST /auth/magic-link` `{ email }` — **toujours 200** (pas d’énumération). Envoi Brevo EU si `BREVO_*` configuré ; sinon stub log en dev (+ `devToken`).
- `GET /auth/verify?token=` — one-shot (hash Redis TTL 15 min), crée session opaque Redis (7 j), cookie `httpOnly` / `Secure` (prod) / `SameSite=Lax`. Redirect `?redirect=` allowlisté (`AUTH_REDIRECT_ALLOWLIST`, open-redirect hardening) ; invalide → `/app`.
- `POST /auth/logout` — destroy session + clear cookie.
- Routes protégées : `SessionGuard` (cookie Redis). Stub Bearer `annex21-dev-stub` **uniquement** si `AUTH_ALLOW_STUB=true` **et** `NODE_ENV=development`.
- Onboarding server gate : **`orgs.onboarding_completed_at`** (Postgres) + session Redis mirror. `OnboardingGuard` → **403 `ONBOARDING_REQUIRED`** sur connectors / assessments / incidents / trust writes. Exempt : auth, onboarding, public trust GET. Pas de Stripe / SSO en V1.
- Fallback in-memory Redis **uniquement** en development (warning console).

## Connecteurs MVP

Providers : **entra** | **google_workspace** | **aws**.

| Provider | Auth | Scopes / notes |
|----------|------|----------------|
| Entra | OAuth | `openid offline_access User.Read AuditLog.Read.All` — **jamais** `Directory.Read.All` — UX « lecture journaux d’audit » |
| Google Workspace | OAuth | `admin.directory.user.readonly` + `admin.reports.audit.readonly` |
| AWS | AssumeRole | ExternalId + ARN (pas OAuth user) |

- Secrets chiffrés AES-GCM (`CONNECTOR_SECRETS_KEY`) — jamais loggés.
- États : `disconnected` \| `connecting` \| `connected` \| `syncing` \| `error`.
- Sync stub → métadonnées evidence MinIO path `eu/…`. Erreur `CONNECTOR_NO_DATA_EXPORTED` → « aucune donnée exportée » + Retry.
- Revoke : delete secrets, conserve evidence historique (stale).

API : `GET /connectors`, `POST /connectors/:provider/connect|sync|revoke`, `GET /connectors/:provider/callback`.

## Prérequis

- Node.js ≥ 20
- [pnpm](https://pnpm.io) 9.x (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- Docker + Docker Compose

## Démarrage exact

```bash
# 1. Dépendances
pnpm install

# 2. Infra locale (Postgres, Redis, MinIO) — data in-EU
docker compose -f infra/docker-compose.yml up -d

# 2b. Migration assessment/playbooks (aussi auto au boot API si Postgres up)
pnpm --filter @annex21/api migrate

# 3. Web (Next.js :3000) + API (NestJS :3001)
pnpm dev
```

Commandes ciblées :

```bash
pnpm dev:web    # apps/web uniquement
pnpm dev:api    # apps/api uniquement
pnpm build      # shared → api + web
```

Variables : copier `.env.example` vers `.env` (aucun secret de prod dans l’exemple).

## Surfaces web

| Route | Rôle |
|-------|------|
| `/` | Landing (hero, value props, CTA, bandeau SLA placeholder) |
| `/trust/[org]` | Trust Center public — états **DRAFT** vs **PUBLIC**. **Aucune preuve brute.** |
| `/app/login` | Demande magic-link |
| `/app/login/check-email` | Confirmation générique (anti-énumération) |
| `/app/onboarding` | Étape 1/2 — organisation (secteur NIS2, rôle CISO) — **POST /onboarding/complete** (server) |
| `/app` | Étape 2/2 — org picker stub + grille connecteurs (5 états) — **RequireOnboarding** via GET /onboarding/status |
| `/app/assessment` | Assessment NIS2 — empty / brouillon / résultat + gaps + contrôles |
| `/app/controls` | Contrôles org — list / update statuts |
| `/app/playbooks` | Templates FR-ANSSI + ouverture incident |
| `/app/incidents` | Bannière SLA live, étapes, liaison preuves stub |
| `/app/trust-editor` | Éditeur Trust (draft) + checklist publish + unpublish |
| `/app/trust-editor/preview/[org]` | Preview auth draft (≠ public) |
| `/app/*` | Assessment, Playbooks ANSSI, Evidence |

Demos Trust (sans API) : `/trust/acme` (public) et `/trust/novatech` (empty), `/trust/demo-draft` → 404 public.

## API (NestJS)

| Méthode | Chemin | Notes |
|---------|--------|--------|
| `GET` | `/health` | Liveness |
| `POST` | `/auth/magic-link` | Magic-link (toujours 200) |
| `GET` | `/auth/verify` | One-shot + cookie session |
| `POST` | `/auth/logout` | Destroy session |
| `GET` | `/me` | Auth — user + onboarding status (server gate) |
| `GET` | `/onboarding/status` | Auth — `{ completed, completedAt, org }` |
| `POST` | `/onboarding/complete` | Auth — `{ orgName, nis2Sector, cisoRole }` → persist Redis/Postgres |
| `GET` | `/public/trust/:orgSlug` | **Published only** — 404 si draft |
| `GET` | `/trust/:orgSlug` | Auth — draft OK (sans evidence) |
| `PATCH` | `/trust/:orgSlug` | Auth — patch brouillon (profil / locale / disclaimer) |
| `GET` | `/trust/:orgSlug/checklist` | Auth — checklist publish V1 |
| `POST` | `/trust/:orgSlug/publish` | Auth — gated checklist → published + audit |
| `POST` | `/trust/:orgSlug/unpublish` | Auth — published → draft + audit |
| `GET/POST` | `/evidence`, `/evidence/:id` | **Privé uniquement** |
| `GET/POST` | `/orgs`, `/orgs/:slug` | Organisations |
| `GET/POST` | `/connectors…` | Connecteurs MVP — **403 ONBOARDING_REQUIRED** si `orgs.onboarding_completed_at` null (callback OAuth exempt) |
| `GET/POST/PATCH` | `/assessments…` | Assessment NIS2 — **403 ONBOARDING_REQUIRED** |
| `GET/POST` | `/incidents…` | Incidents/SLA — **403 ONBOARDING_REQUIRED** |
| `PATCH/POST` | `/trust/:slug`, `/publish`, `/unpublish` | Trust writes — **403 ONBOARDING_REQUIRED** (GET draft OK; public GET exempt) |
| `GET/PATCH` | `/controls`, `/controls/:id` | Statuts contrôles org |
| `GET` | `/playbooks/templates` | Templates FR-ANSSI immutables |
| `GET/POST` | `/incidents…` | Open / complete step / link evidence / close + `GET /incidents/sla` |
| `GET` | `/audit-events` | Journal append-only |


## Structure

```
annex21/
├── apps/web          Next.js 15 App Router + Tailwind
├── apps/api          NestJS (Auth, Connectors, Assessments, Incidents…)
├── packages/shared   Types / DTOs (Trust, Assessment, Playbook, Incident…)
├── infra/            docker-compose + migrations SQL (assessment/playbooks)
├── brand/            Identité visuelle
└── CDC-fonctionnel.md
```

## Qualité / règles métier encodées

- **RG-07** draft ≠ public (contrôleur public vs authentifié séparés).
- **RG-08** pas de preuves brutes sur le Trust public (DTO `PublicTrustCenter` sans evidence).
- **RG-10** data in-EU (compose + README + commentaires API).
- V1 = NIS2 hors finance : aucun claim DORA dans l’UI.


## Trust editor (V1)

### Figma overlays (Trust editor)

Frames Maquettiste : `screenshots/trust-editor/` (file [Azjl81f8…](https://www.figma.com/design/Azjl81f8lWazR4mbgOovSW?node-id=21-2), page `21:2`).
Attributs `data-luix-frame` / `data-figma-node` sur éditeur / preview / modal+toast / public / empty.

- **RG-07** draft ≠ public : `/trust/:org` published-only ; preview auth sous `/app/trust-editor/preview/...`.
- **Publish gated** : org nommée + ≥1 contrôle attesté + disclaimer ack — erreurs FR sinon.
- **Unpublish** → brouillon ; CTA soft quand status published.
- **Zéro evidence** sur Trust (éditeur + public). Persisté `trust_centers` (Postgres DomainStore / mémoire).
- **FORCE_EU_RESIDENCY_WARN** : jamais en prod — `assertEuResidency` fail-closed même si flag set.

## Assessment + Playbooks (V1)

### Figma overlays (Assessment + Playbooks)

Frames Maquettiste : `screenshots/assessment-playbooks/` (file [Azjl81f8…](https://www.figma.com/design/Azjl81f8lWazR4mbgOovSW)).
Attributs `data-luix-frame` / `data-figma-node` sur empty / skeleton / résultat / gap / playbook / SLA / evidence pour overlay ultérieur.
UX Chef : `requires_evidence` → « Marquer fait » **disabled** + erreur inline ; preuve optionnelle = warning soft non bloquant.



- **Privé uniquement** (`AppAuthGuard` / SessionGuard) — jamais sur `/public/trust` ni `/trust/[org]` (RG-07/08).
- Assessment : CRUD brouillon + `POST …/complete` (scoring simplifié, `disclaimer_ack` obligatoire).
- Contrôles org : list / update status.
- Playbooks : `GET /playbooks/templates` (FR-ANSSI 24h/72h/1 mois, jsonb immutable).
- Incidents : open → complete step (REJECTED si `requires_evidence` sans preuve) → close ; SLA countdown `GET /incidents/sla`.
- `audit_events` append-only sur mutations clés.
- Store domain (assessments/controls/playbooks/incidents/audit) : **Postgres** si `DATABASE_URL` / `POSTGRES_*` joignable, sinon **in-memory** (dev, warning console).
- Migration SQL : `infra/migrations/001_assessment_playbooks.sql` — appliquée au boot API, ou `pnpm --filter @annex21/api migrate`.
- `assertEuResidency()` au boot API (`DATA_RESIDENCY=EU`, refuse régions `us-*`).
- Hors V1 : DORA, DE BSI, TPRM, Trust publish auto, cron alerts, PDF export.

## Licence

Propriétaire — Annex21. Usage interne MVP.

## Billing ACV (Stripe, sales-led)

- `POST /billing/checkout` — Checkout Session (subscription ACV ± fee onboarding)
- `GET /billing/status` — `pending` | `active` | `past_due` | `canceled`
- `POST /billing/webhook` — Stripe-Signature + raw body, idempotent
- UI : `/app/billing` (void soft, CTA « Réessayer » si `past_due`)
- Secrets EU : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` côté API uniquement (`DATA_RESIDENCY=EU`)
