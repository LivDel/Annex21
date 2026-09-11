# Annex21 — Handoff look Figma v2 (transcendant)

Figma : https://www.figma.com/design/HJPZqxFrkpKBLx9UiyHiJN  
Frames v2 : Landing `8:17` · Trust `8:77` · App `9:7`

## Tokens (CSS / Tailwind)

```css
:root {
  --void: #05080F;
  --navy: #0B1220;
  --primary: #1D4ED8;
  --glow: #5B8CFF;
  --teal: #0EA5A4;
  --teal-bright: #2DD4BF;
  --text: #F8FAFC;
  --muted: #94A3B8;
  --glass-bg: rgba(248, 250, 252, 0.06);
  --glass-border: rgba(248, 250, 252, 0.12);
  --danger: #B91C1C;
  --warn: #F59E0B;
  --ok: #10B981;
}
```

Aurora : radial gradients soft blue/teal sur fond void (blur, opacity basse).  
Glass : cards `backdrop-blur` + border glass + fill glass-bg.

## Logos SVG (pour le repo)

- `annex21-logo.svg` — wordmark clair
- `annex21-logo-on-dark.svg` — wordmark sur void
- `annex21-mark.svg` — icône seule

Chemins source Maquettiste :
`/workspace/annex21/brand/annex21-logo.svg`
`/workspace/annex21/brand/annex21-logo-on-dark.svg`
`/workspace/annex21/brand/annex21-mark.svg`

## 3 points de fidélité non négociables vs Figma

1. **Landing** — hero void + aurora, headline oversized, CTA primaire `#1D4ED8`, cards Betroffenheit en glass flottantes (pas de layout “SaaS blanc générique”).
2. **Trust `/trust/:org`** — surface sombre glass ; badge **« Lecture seule · Public »** ; **zéro preuve brute** ; empty « Profil en préparation ».
3. **`/app` shell** — sidebar navy sombre + logo mark ; **bannière SLA** lisible (24h / 72h / 1 mois) ; strip playbook ANSSI ; look dense premium (pas flat light).

Look void/glass/logo = ce follow-up (séparé du merge PR #2 structure).
