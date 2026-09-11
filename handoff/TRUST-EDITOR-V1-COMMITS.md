# Suggested commits — feat/trust-editor

Parent agent : créer la branche `feat/trust-editor`, committer, push + PR. **Ne pas push depuis l’executor.**

## Suggested commit sequence

1. **shared: Trust draft/checklist types + audit trust.***  
   `packages/shared/src/types/trust.ts`, `audit.ts`, `index.ts`

2. **api: DomainStore trust_centers (Postgres + memory) + migration 002**  
   `infra/migrations/002_trust_editor.sql`, `apps/api/src/db/migrate.ts`, `store/*`, `db/pg.service.ts`, `common/in-memory.store.ts`

3. **api: Trust editor endpoints — GET/PATCH draft, publish gated, unpublish, audit**  
   `apps/api/src/trust/**`, `common/eu-residency.ts`, `.env.example`

4. **web: Trust editor UI + preview + public empty (Figma 21:2 overlays)**  
   `apps/web/components/trust/**`, `trust-editor/**`, `trust/[org]/**`, `lib/*`, badges, control-status

5. **docs: README + US-trust-editor-v1 + screenshots INDEX**  
   `README.md`, `US-trust-editor-v1.md`, `handoff/*`

## Key files touched

- API: `trust.service.ts`, `trust.controller.ts`, DTOs, `002_trust_editor.sql`, DomainStore
- Web: `trust-editor-panel.tsx`, preview page, public page (empty + published)
- Softs: unpublish CTA, muted `#CBD5E1`, no `aurora-orb` on public empty
