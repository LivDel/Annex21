# Suggested commits — feat/sso-v1

Parent agent : brancher depuis `79d19d5`, committer le lot 1→7, **une seule PR**.  
Executor : **ne pas push / ne pas ouvrir la PR**.

## Constraints (Chef GO + Maquettiste)
- Roles CDC only: `owner|admin|member|viewer` — IGNORE Figma « Contributor »
- 1st SSO user = `member` (NOT admin) · zero JIT admin
- Wizard: validation + fields **only for ACTIVE mode** (OIDC vs SAML)
- Magic link unchanged · Redis opaque sessions · `sanitizeAuthRedirect`
- Out: SCIM, multi-IdP/org, social

## Suggested single-PR commit sequence (or one squash)

1. **shared: SSO types + CDC OrgMemberRole**  
   `packages/shared/src/types/sso.ts`, `session.ts`, `org.ts`, `dto/auth.dto.ts`, `index.ts`

2. **api: migration 005 + DomainStore IdP/members**  
   `infra/migrations/005_sso.sql`, `store/*`, `db/migrate.ts`

3. **api: SSO module (OIDC openid-client + SAML node-saml + AES-GCM + admin CRUD)**  
   `apps/api/src/sso/**`, `app.module.ts`, `package.json` (deps), `.env.example`

4. **web: login choice, callback, wizard, users mapping, AppShell Paramètres**  
   `apps/web/components/sso/**`, `app/app/login`, `app/auth/**`, `app/app/settings/**`, `app-shell.tsx`, `lib/app-api.ts`

5. **docs: handoff SSO**  
   `handoff/SSO-V1-COMMITS.md`, `handoff/FIGMA-SSO-V1.md`

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/auth/sso/options` | public |
| GET | `/auth/sso/oidc/start` | public → IdP |
| GET | `/auth/sso/oidc/callback` | public → cookie |
| GET | `/auth/sso/saml/start` | public → IdP |
| GET | `/auth/sso/saml/metadata` | public SP XML |
| POST | `/auth/sso/saml/acs` | public → cookie |
| GET | `/auth/sso/error-message` | public |
| GET/PUT | `/orgs/:orgId/sso/idp` | session + onboarding |
| POST | `/orgs/:orgId/sso/idp/test` | owner/admin |
| POST | `/orgs/:orgId/sso/idp/revoke` | owner/admin |
| GET | `/orgs/:orgId/sso/members` | session |
| PATCH | `/orgs/:orgId/sso/members/:id` | owner/admin |

Magic link: `POST /auth/magic-link`, `GET /auth/verify` **unchanged**.

## UI routes

| Route | Frame |
|-------|-------|
| `/app/login` · `/auth` | 01 login choix |
| `/auth/callback` | 07/08 callback |
| `/app/settings` | hub |
| `/app/settings/sso` | 02–06 wizard + 10 badge |
| `/app/settings/users` | 09 mapping |

## Figma
https://www.figma.com/design/Azjl81f8lWazR4mbgOovSW?node-id=38-2  
void soft AA · muted `#CBD5E1` · accent `#1d4ed8`
