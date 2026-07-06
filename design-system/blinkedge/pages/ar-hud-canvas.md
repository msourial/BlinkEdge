# AR HUD Canvas Page Overrides — BlinkEdge

> **PROJECT:** BlinkEdge
> **Page:** AR HUD Canvas (`app/page.tsx`)
> **Generated:** 2026-07-06
> **Source:** DESIGN.md + research/ARCHITECTURE.md + research/PITFALLS.md

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/blinkedge/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout — Camera-as-Canvas Layer Stack

**CRITICAL:** The camera `<video>` and every HUD widget are **direct children of an opaque app shell**. Never wrap HUDs in a translucent scrim — any ancestor with `opacity < 1` becomes a backdrop root and silently breaks `backdrop-filter` blur sampling.

```tsx
// app/page.tsx — CORRECT layer stack
<main className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-canvas">
  <CameraBackdrop />           {/* z0 — opaque <video> */}
  <Scoreboard />               {/* z20 — translucent HUD, direct sibling */}
  <OddsMatrix />               {/* z20 */}
  <ConsensusIndicator />       {/* z20 */}
  {/* z30: RiskAlertSheet (Phase 3a) */}
  {/* z40: BlinkHedgeCard (Phase 3b) */}
  {/* z50: Permission/wallet modals */}
</main>
```

### Z-Index Scale (10/20/30/50 system)

| Layer | Z-Index | Component |
|-------|---------|-----------|
| Camera video | `z-0` | `<CameraBackdrop>` opaque `<video>` |
| Gradient fallback | `z-10` | Shown when camera denied/unavailable |
| HUD widgets | `z-20` | Scoreboard, OddsMatrix, ConsensusIndicator |
| Risk alert sheet | `z-30` | Bottom-sheet overlay (Phase 3a) |
| Blink hedge card | `z-40` | Action client modal (Phase 3b) |
| Permission/wallet modals | `z-50` | Top-most user interaction |

### Translucency Overrides

- **HUD background:** `rgba(10,10,15,0.35)` — TV broadcast visible through widgets
- **NEVER use `opacity: 0.35`** on HUD container — that creates a backdrop root
- **Mobile fallback (blur budget exceeded):** `rgba(10,10,15,0.55)` solid (no blur)
- **Max 3 concurrent `backdrop-blur(16px)` elements** — enforced by `lib/perf/blurBudget.ts`

### HUD Widget → Card Variant Mapping

| Widget | Position | Card Variant | Neon Color | Mobile Layout (≤425px) |
|--------|----------|--------------|------------|------------------------|
| Scoreboard | Top-center | `card-neon` | Cyan `#00f0ff` | Full-width top |
| OddsMatrix | Right-edge | `card-neon-magenta` | Magenta `#ff00e5` | Static card (no collapse logic) |
| ConsensusIndicator | Bottom-center | `card-neon-acid` | Acid `#39ff14` | Full-width bottom |

### Mobile-First Layout (≤425px default)

```
┌─────────────────────────┐
│      [Scoreboard]       │  ← top, full-width, cyan
│                         │
│   (camera video feed)   │  ← z0, visible through HUDs
│                         │
│       [OddsMatrix]      │  ← right-edge, magenta (static)
│                         │
│    [ConsensusIndicator] │  ← bottom, full-width, acid
└─────────────────────────┘
```

**Rule:** Base classes (no prefix) target mobile. `sm:`/`md:`/`lg:` ADD layout at larger widths. For Phase 1 MVP, ship mobile-only — no responsive OddsMatrix expansion/clamp logic.

### Safe-Area Insets

```css
.hud-overlay-top    { padding-top: env(safe-area-inset-top); }
.hud-overlay-bottom { padding-bottom: env(safe-area-inset-bottom); }
.hud-overlay-right  { padding-right: env(safe-area-inset-right); }
```

**Prerequisite:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">` — without `viewport-fit=cover`, `env()` returns 0.

### Camera Permission Flow

1. On mount: attempt `getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })`
2. If granted: mount `<video>` with `object-fit: cover`
3. If denied/error: fallback to gradient backdrop (`bg-canvas` with radial gradient)
4. **iOS re-acquire:** Listen `visibilitychange` → `track.stop()` on hidden → re-`getUserMedia` on visible with 200ms exponential backoff
5. Show "Camera re-connecting…" amber overlay during re-acquire

### Performance Budget

- Max 3 concurrent `backdrop-blur` elements (the 3 HUD widgets)
- `will-change: backdrop-filter` on HUD overlays
- `contain: layout paint` on HUD overlays
- Camera `<video>` uses `object-fit: cover` (GPU-friendly, no JS resize)
- Mock tick cadence: 2000ms
- Target: ≥30fps on Pixel 4a / iPhone SE 2nd gen for 5 min continuous
- Auto-downgrade on `navigator.hardwareConcurrency ≤ 4` or `deviceMemory ≤ 4`

### Text Legibility Over Video

- Neon text (cyan/magenta/acid) over bright broadcast frames drops below WCAG AA 4.5:1
- **Mitigation:** `text-shadow: 0 0 4px rgba(10,10,15,0.9)` halo on all HUD text
- Min font size 14px on HUD data values
- Auto-bump HUD bg to 0.55 when avg video luminance > 0.6 (Phase 2 polish — skip for MVP)

---

## Page-Specific Components

### CameraBackdrop
- `<video autoPlay muted playsInline>` with `object-fit: cover`
- `getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })`
- `visibilitychange` listener for iOS re-acquire
- Gradient fallback element (z-10) shown on deny/error

### Scoreboard (card-neon, cyan)
- Top-center, `absolute top-0 inset-x-0`
- Displays: live score + match minute (JetBrains Mono)
- Reads from `TxLineProvider` context

### OddsMatrix (card-neon-magenta)
- Right-edge, `absolute right-0 top-1/2 -translate-y-1/2`
- Displays: betting odds (JetBrains Mono)
- Phase 1 MVP: static card, no responsive collapse

### ConsensusIndicator (card-neon-acid)
- Bottom-center, `absolute bottom-0 inset-x-0`
- Displays: market consensus (JetBrains Mono)
- Reads from `TxLineProvider` context

---

## Recommendations

- **Effects:** Neon glow (`text-shadow` halo for legibility), subtle tick pulse on data update (200ms opacity), stagger entrance (150-300ms, `power2.out`)
- **Touch:** `touch-action: manipulation` on app shell to prevent double-tap zoom
- **Reduced motion:** Disable tick pulse + stagger entrance when `prefers-reduced-motion: reduce`
- **Loading:** Skeleton glow pulse while `TxLineProvider` initializes (first 2s tick)
