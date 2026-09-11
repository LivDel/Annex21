# Figma Stripe ACV V1 — handoff overlay

File: https://www.figma.com/design/Azjl81f8lWazR4mbgOovSW?node-id=28-2
Canvas: Billing / Stripe ACV (`28:2`)

## Frames
| ID | Name | Intent |
|----|------|--------|
| 30:2 | 01 empty | Pas encore d’abonnement · CTA Démarrer le checkout + Contacter les ventes |
| 30:45 | 02 devis ACV | Carte devis 10–30 k€/an · fee onboarding OPTION · Payer le devis (Checkout) · aide sales-led |
| 31:2 | 03 badges | pending / active / past_due / canceled |
| 31:61 | 04 past_due | Bannière rouge + CTA **Réessayer** + Mettre à jour le paiement |
| 31:119 | 05 pending | Activation en cours |
| 32:2 | 06 active factures | Résumé ACV + liste factures Payée + lien PDF |
| 32:87 | 07 toasts | success / warning / error / info |

## Copy & constraints (exact)
- Subtitle empty: `Abonnement ACV annuel · sales-led · pas de freemium`
- Empty body: contact commercial OU checkout avec devis signé
- Footnote: `Sales-led · ACV 10–30 k€/an · aucune clé Stripe côté client`
- Devis: pas de price picker self-serve; `Payer le devis (Checkout)` / `Demander une révision`
- past_due: badge `past_due`, CTA **Réessayer** (rouge `#b91c1c`)
- muted text `#CBD5E1`, void `#05080f`, accent `#1d4ed8`
- Nav label: **Facturation**
- Zéro secret Stripe front

## Implement in
- `apps/web/components/billing/*`
- `apps/web/app/app/billing/page.tsx`
- app-shell nav label Facturation if needed
- Optional toast component for query `?checkout=success|cancel`
