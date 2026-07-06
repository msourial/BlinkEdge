# Design System Master File — BlinkEdge NeonChrome

> **LOGIC:** When building a specific page, first check `design-system/blinkedge/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** BlinkEdge
**Design System:** NeonChrome (per DESIGN.md)
**Category:** Mobile-first AR/HUD PWA — World Cup football companion
**Design Dials:** Variance 6/10 (Balanced) | Motion 7/10 (Standard) | Density 8/10 (Dense / HUD overlay)
**Source of Truth:** `DESIGN.md` (repo root) — this file is a quick-reference summary

---

## Core Principle

> Dark chrome is the canvas, neon glow is the language. Every surface sits in near-black metallic register. Every interactive element speaks in glowing neon. The glow IS the depth — no drop shadows anywhere.

---

## Color Palette

### Neon Accents (one per component, never mix)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary (Electric Cyan) | `#00f0ff` | `--color-primary` | Scoreboard, primary CTA, focus rings |
| Secondary (Hot Magenta) | `#ff00e5` | `--color-magenta` | OddsMatrix, error states |
| Tertiary (Acid Green) | `#39ff14` | `--color-acid` | ConsensusIndicator, success states |
| Quaternary (Ultraviolet) | `#b44dff` | `--color-violet` | Tertiary accents (sparingly) |
| Warning (Amber) | `#ffb800` | `--color-amber` | Mock hedge badge, warning states |

### Surfaces (dark chrome tiers)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-canvas` | `#0a0a0f` | Page background (NEVER pure `#000000`) |
| `--color-surface-chrome` | `#111118` | Card surfaces, HUD backgrounds (opaque variant) |
| `--color-surface-raised` | `#16161f` | Elevated panels |
| `--color-surface-overlay` | `#1c1c28` | Modals, popovers |
| `--color-surface-deep` | `#06060a` | Input wells, code blocks |

### HUD Translucency (AR-over-camera)

| Token | Value | Usage |
|-------|-------|-------|
| `--hud-bg-translucent` | `rgba(10,10,15,0.35)` | HUD widget backgrounds — TV visible through |
| `--hud-bg-mobile` | `rgba(10,10,15,0.55)` | Mobile fallback when blur budget exceeded |
| `--hud-border` | 1px solid `{neon-color}` | Each HUD has exactly ONE neon border |
| `--hud-blur` | `backdrop-filter: blur(16px)` | Max 3 concurrent (GPU budget) |

### Text

| Token | Hex/Value | Usage |
|-------|-----------|-------|
| `--color-ink` | `#e8eaed` | Primary text (warm off-white) |
| `--color-ink-body` | `rgba(232,234,237,0.82)` | Body text |
| `--color-ink-muted` | `rgba(232,234,237,0.55)` | Secondary, captions |
| `--color-ink-faint` | `#55575e` | Disabled, tertiary |

---

## Typography

| Token | Font | Size | Weight | Line-Height | Usage |
|-------|------|------|--------|-------------|-------|
| `--text-display-md` | Inter | 36px | 700 | 1.1 | HUD score (clamped on mobile) |
| `--text-heading-sm` | Inter | 16px | 600 | 1.4 | HUD labels |
| `--text-body-md` | Inter | 16px | 400 | 1.5 | UI labels (NEVER >400 body weight) |
| `--text-code-md` | JetBrains Mono | 14px | 400 | 1.6 | Scores, odds, data values |
| `--text-label` | Inter | 11px | 700 | 1.0 | Uppercase eyebrows, badges (1.5px tracking) |

**Google Fonts:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
```

---

## Spacing (4/8px rhythm)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Inline icon gaps |
| `--space-sm` | 8px | HUD internal padding |
| `--space-md` | 12px | Standard padding |
| `--space-lg` | 16px | HUD widget padding |
| `--space-xl` | 24px | Section gaps |
| `--space-2xl` | 32px | Card padding |

---

## Glow-as-Depth System (NO drop shadows)

| Level | Box-Shadow | Usage |
|-------|------------|-------|
| `--glow-sm` | `0 0 6px {neon-glow}` | Rest state, subtle accents |
| `--glow-md` | `0 0 12px {neon-glow}` | Hover/active, focus |
| `--glow-lg` | `0 0 20px {neon-glow}` | Primary CTA, active card |
| `--glow-spread-sm` | `0 0 6px, 0 0 12px {neon-glow}` | Neon-bordered cards at rest |
| `--glow-spread-md` | `0 0 8px, 0 0 20px, 0 0 40px {neon-glow}` | Active/hover bloom |
| `--glow-spread-lg` | `0 0 12px, 0 0 24px, 0 0 48px, 0 0 80px {neon-glow}` | Hero max — ONE per viewport |

**Rule:** Max 1 `spread-lg` element per viewport. Glow intensity ladder communicates importance.

---

## Component Specs

### HUD Widget Card (card-neon variant)

```css
.hud-card {
  background: rgba(10,10,15,0.35);        /* Translucent — TV visible */
  border: 1px solid var(--color-primary); /* ONE neon color per card */
  border-radius: 12px;                     /* rounded.lg — never full */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  will-change: backdrop-filter;
  contain: layout paint;
  box-shadow: var(--glow-spread-sm), inset 0 0 8px var(--primary-glow-wide);
  padding: var(--space-lg);
}
```

### Neon Button (button-neon-cyan)

```css
.btn-neon {
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: 8px;                      /* rounded.md — never full */
  padding: 10px 24px;
  font-weight: 600;
  box-shadow: var(--glow-spread-md);
  transition: box-shadow 200ms ease;
  cursor: pointer;
}
.btn-neon:hover { box-shadow: var(--glow-spread-lg); }
```

---

## Motion (Standard tier)

**HUD entrance:** Stagger fade-in + glow bloom (150-300ms, `power2.out`)
**Tick pulse:** Subtle opacity/glow pulse on data update (200ms)
**Risk-to-Blink bloom:** `spread-sm` → `spread-lg` transition on hedge trigger (400ms, `power2.inOut`)

```js
// HUD entrance choreography
const tl = gsap.timeline();
tl.from('.hud-card', { opacity: 0, y: 8, duration: 0.25, stagger: 0.08, ease: 'power2.out' })
  .to('.hud-card', { boxShadow: 'var(--glow-spread-sm)', duration: 0.2 });
```

**Rules:**
- ✅ Use CSS transform (opacity, y) for HUD entrance — compositor thread
- ✅ `prefers-reduced-motion: reduce` → disable all non-essential motion
- ❌ No `animate-bounce` or infinite decorative animations (loading spinners only)
- ❌ No layout-shifting transforms on hover

---

## Anti-Patterns (FORBIDDEN)

- ❌ Pure `#000000` background (use `#0a0a0f`)
- ❌ Drop shadows (use glow box-shadow)
- ❌ Two `spread-lg` elements in one viewport
- ❌ Neon color as solid background fill (neon = borders/text/glow only)
- ❌ Body text weight > 400
- ❌ Body line-height < 1.5
- ❌ `rounded.full` on cards or buttons
- ❌ Mixing neon colors on one element
- ❌ Opacity < 1 on ancestor of backdrop-filter (creates backdrop root, breaks blur)
- ❌ Emojis as structural icons (use SVG: Heroicons/Lucide)
- ❌ Touch targets < 44px on mobile
- ❌ `100vh` (use `100dvh` for mobile browser chrome)
- ❌ Missing `viewport-fit: cover` (safe-area insets return 0 without it)

---

## Pre-Delivery Checklist

### NeonChrome Compliance
- [ ] No pure `#000000` anywhere (grep for `#000000` and `#000`)
- [ ] No drop shadows (grep for `box-shadow` without color)
- [ ] Max 1 `spread-lg` per viewport
- [ ] No neon as solid background fill
- [ ] All body text weight ≤ 400
- [ ] All body line-height ≥ 1.5
- [ ] No `rounded.full` on cards/buttons
- [ ] No mixed neon colors on one element

### AR/HUD Compliance
- [ ] HUD backgrounds use `rgba(10,10,15,0.35)` — NOT `opacity: 0.35`
- [ ] Max 3 concurrent `backdrop-blur` elements (`blurBudget.ts` guard)
- [ ] HUDs are direct children of opaque app shell (no opacity<1 ancestor)
- [ ] `will-change: backdrop-filter` on all HUD overlays
- [ ] `contain: layout paint` on all HUD overlays
- [ ] Camera `<video>` uses `object-fit: cover`
- [ ] `100dvh` + `fixed inset-0` + `overflow: hidden` app shell
- [ ] `viewport-fit: cover` in meta
- [ ] `env(safe-area-inset-*)` padding on HUD overlays

### Mobile/A11y
- [ ] Touch targets ≥ 44px height
- [ ] `prefers-reduced-motion` respected
- [ ] Text contrast ≥ 4.5:1 (text-shadow halo on neon text over video)
- [ ] Tested on 375px (small phone)
- [ ] iOS `visibilitychange` camera re-acquire works
- [ ] ≥30fps on Pixel 4a / iPhone SE 2 for 5 min continuous

### Solana (Phase 3b only)
- [ ] `autoConnect: false` on wallet
- [ ] Visible "devnet" cluster badge
- [ ] `simulateTransaction` before `signAndSendTransaction`
- [ ] `setComputeUnitPrice` always set
- [ ] Amber "MOCK HEDGE" badge if mock fallback active
