---
last_mapped_commit: pre-init
mapped_at: 2026-07-06
focus: quality
---

# Codebase Conventions

## Current State

**Status:** Pre-initialization — no application code exists yet. Conventions are derived from DESIGN.md specification.

## Design System: NeonChrome

### Color Usage Rules (DESIGN.md enforced)

1. **Never use pure `#000000`** — the chrome undertone in `#0a0a0f` is intentional. Always use `bg-canvas` token.
2. **Glow-as-depth** — no drop shadows. Depth comes from 1px neon borders + multi-layer `box-shadow` glow.
3. **Max 1 `spread-lg` element per viewport** — glow intensity ladder:
   - `rest` state → `spread-sm`
   - `event` state → `spread-md`
   - `hero` state → `spread-lg` (only one per viewport)
4. **No neon as solid background fill** — neon colors are for borders, text, and glow only.
5. **No two neon colors on one element** — each HUD widget has exactly ONE neon accent.

### Typography Rules

- **Body text:** Inter, weight 400 only (never >400)
- **Data/scores:** JetBrains Mono, weight 600
- **Line-height:** ≥1.5 for body text
- **Display tier:** `display-md` (36px) on mobile, clamps down from larger sizes

### Component Spacing

- **Card border-radius:** `rounded.lg` (12px)
- **Button border-radius:** `rounded.md` (8px)
- **Never use `rounded.full` on cards**

### HUD Widget → Card Variant Mapping

| Widget | Card Variant | Neon Color | Position |
|--------|-------------|------------|----------|
| Scoreboard | `card-neon` | Cyan (`#00f0ff`) | Top-center |
| OddsMatrix | `card-neon-magenta` | Magenta (`#ff00e5`) | Right-edge |
| ConsensusIndicator | `card-neon-acid` | Acid green (`#39ff14`) | Bottom-center |

### Translucency (AR-over-camera)

- HUD background: `rgba(10,10,15,0.35)` — TV must be visible through widgets
- `backdrop-filter: blur(16px)` on all HUD overlays
- Max 3 concurrent blurred elements (GPU budget)

## Code Style (planned)

- **TypeScript strict mode** — no `any`, no `@ts-ignore`
- **Zod schemas** — all external data validated at boundary
- **React Server Components** by default, `'use client'` only when needed (camera, state)
- **Functional components** — no class components
- **Named exports** preferred over default exports
- **No comments unless asked** — code should be self-documenting

## Mobile-First Rules

- **Touch targets:** min 44px height on mobile (per DESIGN.md)
- **Viewport:** `100dvh` (dynamic viewport height)
- **Layout:** mobile (≤425px) is the default; `sm:`/`md:`/`lg:` prefixes ADD layout
- **Safe-area insets:** `env(safe-area-inset-*)` on HUD overlays
- **No pinch-zoom:** `maximum-scale: 1` in viewport meta

## Performance Rules

- **`will-change: backdrop-filter`** on HUD overlays
- **`contain: layout paint`** on HUD overlays
- **`object-fit: cover`** on camera `<video>` (GPU-friendly)
- **Tick cadence:** 2000ms (avoid faster re-renders on mobile)
- **Target:** ≥30fps on mid-range mobile (Pixel 4a / iPhone SE 2nd gen)

## Anti-Patterns (explicit acceptance criteria)

- [ ] No drop shadows
- [ ] No pure `#000000`
- [ ] No two `spread-lg` elements in one viewport
- [ ] No neon color as solid background fill
- [ ] No body text weight > 400
- [ ] No body line-height < 1.5
- [ ] No `rounded.full` on cards
- [ ] No mixing neon colors on one element

---
*Last updated: 2026-07-06 — pre-initialization scan*
