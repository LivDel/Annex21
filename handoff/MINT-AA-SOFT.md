# Annex21 — Soft mint AA (void) — handoff Codeur

**Scope:** align Tailwind `annex-mint` + opacity borders with Figma void soft AA.  
**Refs:** `handoff/FIGMA-V2-TOKENS.md`, `apps/web/tailwind.config.ts`, `apps/web/app/globals.css`  
**Date:** 2026-09-14 · soft residual post rgb-channel Tailwind fix

---

## Verdict

| Token / class | Hex / composite | On void `#05080F` | AA |
|---|---|---|---|
| Solid `text-annex-mint` / `bg-annex-mint` | `#2DD4BF` (= Figma `--teal-bright`) | **10.76:1** | ✅ text AA (4.5) + UI (3) |
| `annex-teal` solid | `#0EA5A4` | **6.62:1** | ✅ |
| `border-annex-mint/40` (blended) | ≈ `#155A55` | **2.51:1** | ❌ below UI 3:1 |
| `border-annex-mint/30` | ≈ `#114544` | **1.87:1** | ❌ |
| `border-annex-mint/20` | ≈ `#0D3132` | **1.43:1** | ❌ |
| `border-annex-mint/50` | ≈ `#196E67` | **3.31:1** | ✅ UI 3:1 |
| `border-annex-mint/60` | ≈ `#1D8279` | **4.31:1** | ✅ comfortable |
| Mint text on `bg-annex-mint/10`–`/20` | — | ≥7.5:1 | ✅ badge fills OK |

**Hex stays:** keep **`#2DD4BF`** as `annex.mint` — it matches Figma `--teal-bright` and is strong as solid text/icon on void. Do **not** darken the mint hex to “fix” borders; raise border opacity (or use glass/slate for soft chrome).

Floor for meaningful mint borders on void: **≥ ~47%** → use **`/50`** minimum, prefer **`/60`** for status / attested / SLA.

---

## Recommended mint + opacities (void soft AA)

```css
/* Canonical — already in globals / Figma v2 */
--void: #05080F;
--teal-bright / annex-mint: #2DD4BF;
--teal: #0EA5A4;          /* accents sparingly */
--text: #F8FAFC;
--muted: #CBD5E1;         /* AA small text (prefer over Figma draft #94A3B8) */
--glass-border: rgba(248, 250, 252, 0.12); /* decorative only */
```

| Role | Opacity | Tailwind |
|---|---|---|
| Solid text / dots / icons | 100% | `text-annex-mint` · `bg-annex-mint` |
| Semantic / status border | **50–60%** | `border-annex-mint/50` or `/60` |
| Soft tint fill under mint text | 10–20% | `bg-annex-mint/10` … `/20` (OK) |
| Hover wash | 10% | `hover:bg-annex-mint/10` |
| Decorative card chrome | — | `border-white/10` or `card-glass` (not mint/40) |

Tailwind channels (already correct for `/opacity`):

```ts
mint: 'rgb(45 212 191 / <alpha-value>)', // #2DD4BF
```

---

## What to avoid

1. **`border-annex-mint/40` (and `/20` `/30`)** on void for anything that carries meaning (status pills, attested, SLA ok, trust badges, incident severity chrome). Composite fails **WCAG 1.4.11** non-text contrast (needs ≥3:1).
2. **Mint as primary CTA fill with navy text** without checking — filled mint button is fine; don’t use mint borders as the only affordance at weak opacity.
3. **Primary `#1D4ED8` as body/link text on void** (~2.99:1) — use `annex-blue` / `--glow` `#5B8CFF` for text links; keep deep blue for filled buttons.
4. **Don’t invent a second “AA mint” hex** unless Figma updates — soft AA is an **opacity / role** fix, not a palette fork.
5. Low-opacity mint borders purely as “soft residual” aesthetic — use **glass** (`--glass-border`) or `border-white/10` for soft chrome; reserve mint for success / attested / teal accents.

---

## Concrete Tailwind replacements (mint/40 weak)

| Where (examples) | Avoid | Prefer |
|---|---|---|
| `.status-attested` (`globals.css`) | `border-annex-mint/40` | `border-annex-mint/60` (+ keep `text-annex-mint bg-annex-mint/10`) |
| Landing CTA outline / pills (`app/page.tsx`) | `border-annex-mint/40` | `border-annex-mint/50` or `border-annex-mint/60` |
| Trust badges (`trust-status-badge.tsx`, trust org page) | `/40` `/30` `/20` | `/60` semantic · glass/`white/10` for soft card edges |
| Incidents strip / cards (`incidents-panel.tsx`) | `border-annex-mint/40` · `/30` | `border-annex-mint/60` for ok state; `border-white/10` for neutral cards |
| Onboarding chip (`onboarding/page.tsx`) | `border-annex-mint/40` | `border-annex-mint/50` |

**5 drop-in class swaps for Codeur:**

1. `border-annex-mint/40` → `border-annex-mint/60`
2. `border-annex-mint/30` → `border-annex-mint/50` (or `/60` if status)
3. `border-annex-mint/20` → `border-white/10` (decorative) **or** `border-annex-mint/50` (semantic)
4. Soft card: `border-annex-mint/20` → keep `card-glass` / `border-white/10` (Figma glass)
5. Optional stronger badge: `border-annex-mint/50 bg-annex-mint/15 text-annex-mint`

---

## Note Maquettiste ↔ Codeur

- Figma void soft + teal accents sparingly: **mint = accent/status**, not default chrome.
- rgb-channel Tailwind change fixed **build** (`border-annex-mint/40` JIT); it did **not** fix **contrast** — `/40` still paints too dim on `#05080F`.
- No Figma PR required for this soft AA pass if teal-bright stays `#2DD4BF`; update component specs to **mint border ≥50%** on void.

