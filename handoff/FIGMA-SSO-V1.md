# Figma SSO V1 — handoff overlay

File: https://www.figma.com/design/Azjl81f8lWazR4mbgOovSW?node-id=38-2
Canvas: Auth / SSO V1 (`38:2`)

## Frames
| ID | Name | Intent |
|----|------|--------|
| 38:3 | 01 Login — choix IdP | Continuer avec IdP configurés + magic link fallback · pas de social |
| 39:12 | 02 Owner — wizard idle | Metadata URL OR client_id/secret · Tester la connexion |
| 39:76 | 03 Owner — wizard connecting | Skeleton · Annuler |
| 39:155 | 04 Owner — wizard connected | Connecté · Re-tester · Révoquer |
| 39:220 | 05 Owner — wizard erreur | Soft erreur + **Réessayer** |
| 40:2 | 06 Owner — revoke modal | Confirm + focus trap note |
| 40:23 | 07 Callback — loading | Skeleton OIDC/SAML |
| 40:38 | 08 Callback — erreur | Soft FR + retour login (jamais blank) |
| 41:2 | 09 Admin — mapping users | Org + rôles · nouveaux = Limité · MFA IdP |
| 41:93 | 10 Settings — badge IdP | Strip compact IdP connecté |

## Copy & constraints (exact)
- Login: `Continuer avec Entra ID` / `Continuer avec Google Workspace` + `Recevoir un lien magique`
- Footnote login: `Pas de login social public · IdP OIDC/SAML configurés uniquement`
- MFA hint: `MFA gérée par votre IdP`
- Error CTAs: **Réessayer**
- Out of V1: SCIM, multi-IdP/org, social login
- Visual: void `#05080F`, muted `#CBD5E1`, primary `#1D4ED8`, washes ~0.06, glass, FR, 1440×900

## Screenshots
`/workspace/annex21/screenshots/sso-v1/` (+ INDEX.md)
