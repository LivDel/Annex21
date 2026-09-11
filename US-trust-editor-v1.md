# Annex21 — US : Trust editor V1

**Statut** : implémenté (écriture disque) — PR `feat/trust-editor`  
**Figma** : [page 21:2](https://www.figma.com/design/Azjl81f8lWazR4mbgOovSW?node-id=21-2)  
**Screenshots** : `screenshots/trust-editor/`

## User stories

**US-TE01** — En tant que CISO, je veux éditer un Trust brouillon (profil, contrôles attestés, FR/EN) sans upload de preuves afin de préparer la surface publique.

**US-TE02** — En tant que CISO, je veux prévisualiser le brouillon en auth (`/app/trust-editor/preview/:org`) afin de vérifier le rendu sans exposer `/trust/:org`.

**US-TE03** — En tant que CISO, je veux publier uniquement si la checklist V1 est OK (org nommée + ≥1 contrôle attesté + disclaimer) avec modal de confirmation et toast.

**US-TE04** — En tant que CISO, je veux dépublier (CTA soft) pour repasser en brouillon ; le public redevient 404.

**US-TE05** — En tant qu’acheteur, je vois uniquement le Trust publié ; empty → « Profil en préparation » ; zéro evidence brute.

## Critères d’acceptation

- [x] draft ≠ public (RG-07) — public GET published-only
- [x] Preview auth ≠ URL publique
- [x] Publish gated + erreurs FR
- [x] Unpublish → draft + audit
- [x] Audit `trust.published` / `trust.unpublished` / `trust.draft.updated`
- [x] DomainStore Postgres (`trust_centers`) + seed mémoire
- [x] FORCE_EU_RESIDENCY_WARN fail-closed en prod
- [x] Overlay frames Figma 21:3 / 21:8 / 21:13 / 21:18 / 21:23
- [x] Softs : void, muted #CBD5E1, no orbs, unpublish CTA

## Hors V1

Questionnaires acheteurs, DE copy profonde, publish auto.
