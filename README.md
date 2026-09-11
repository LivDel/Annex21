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
- `GET /auth/verify?token=` — one-shot (hash Redis TTL 15 min), crée session opaque Redis (7 j), cookie `httpOnly` / `Secure` (prod) / `SameSite=Lax`.
- `POST /auth/logout` — destroy session + clear cookie.
- Routes protégées : `SessionGuard` (cookie Redis). Stub Bearer `annex21-dev-stub` **uniquement** si `AUTH_ALLOW_STUB=true` **et** `NODE_ENV=development`.
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
| `/app` | Org picker stub + grille connecteurs (5 états) |
| `/app/*` | Assessment, Playbooks ANSSI, Evidence, Trust editor |

Démos Trust (sans API) : `/trust/acme` (public) et `/trust/demo-draft` (brouillon).

## API (NestJS)

| Méthode | Chemin | Notes |
|---------|--------|--------|
| `GET` | `/health` | Liveness |
| `POST` | `/auth/magic-link` | Magic-link (toujours 200) |
| `GET` | `/auth/verify` | One-shot + cookie session |
| `POST` | `/auth/logout` | Destroy session |
| `GET` | `/public/trust/:orgSlug` | **Published only** — 404 si draft |
| `GET` | `/trust/:orgSlug` | Auth — draft OK (sans evidence) |
| `POST` | `/trust/:orgSlug/publish` | `draft → published` |
| `GET/POST` | `/evidence`, `/evidence/:id` | **Privé uniquement** |
| `GET/POST` | `/orgs`, `/orgs/:slug` | Organisations |
| `GET/POST` | `/connectors…` | Connecteurs MVP |

## Structure

```
annex21/
├── apps/web          Next.js 15 App Router + Tailwind
├── apps/api          NestJS (AuthModule, SessionModule, ConnectorsModule…)
├── packages/shared   Types / DTOs (Trust, Org, Evidence, Session, Connector)
├── infra/            docker-compose (postgres, redis, minio)
├── brand/            Identité visuelle
└── CDC-fonctionnel.md
```

## Qualité / règles métier encodées

- **RG-07** draft ≠ public (contrôleur public vs authentifié séparés).
- **RG-08** pas de preuves brutes sur le Trust public (DTO `PublicTrustCenter` sans evidence).
- **RG-10** data in-EU (compose + README + commentaires API).
- V1 = NIS2 hors finance : aucun claim DORA dans l’UI.

## Licence

Propriétaire — Annex21. Usage interne MVP.
