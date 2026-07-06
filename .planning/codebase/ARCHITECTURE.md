---
last_mapped_commit: pre-init
mapped_at: 2026-07-06
focus: arch
---

# Codebase Architecture

## Current State

**Status:** Pre-initialization — no application code exists. Architecture is planned based on DESIGN.md and product specification.

## Architectural Pattern

**Mobile-first PWA with AR/HUD overlay**

The app uses the phone's camera as the **primary canvas** — the TV broadcast is visible through translucent neon HUD widgets. This is NOT a dark-screen dashboard; it's an AR companion experience.

### Core Principle
> Camera is the main view. HUD widgets float *over* the live camera feed. The TV broadcast must be visible through the widgets.

## Planned Architecture (Phase 1)

```
app/
├── layout.tsx              # Root layout, viewport meta (100dvh, viewport-fit=cover)
├── page.tsx                # Main canvas (fixed inset-0, camera + HUD overlays)
├── manifest.ts            # PWA manifest (standalone, portrait, BlinkEdge theme)
├── icon.tsx               # Dynamic PWA icon
├── apple-icon.tsx         # iOS home screen icon
└── components/
    ├── CameraBackdrop.tsx  # <video> getUserMedia (facingMode: environment)
    ├── Scoreboard.tsx      # Top-center HUD (card-neon, cyan)
    ├── OddsMatrix.tsx      # Right-edge HUD (card-neon-magenta)
    ├── ConsensusIndicator.tsx # Bottom-center HUD (card-neon-acid)
    └── CameraPermissionGate.tsx # Permission onboarding overlay
lib/
├── txline/
│   ├── TxLineProvider.tsx  # React context, in-memory state, 2s tick
│   ├── mockData.ts         # Deterministic mock TxLINE events
│   └── types.ts            # TypeScript types (from ZOD_SCHEMAS.md)
└── schema/
    └── txLineSchema.ts     # Zod schema for TxLineEventPacket
tailwind.config.ts          # NeonChrome tokens mapped to Tailwind
```

## Data Flow

```
TxLINE (mock) → TxLineProvider (2s tick) → HUD Widgets (translucent overlays)
                    ↓                           ↓
            In-memory state              backdrop-blur(16px) over
            (no DB in Phase 1)           camera <video> feed
```

## Mobile-First Layout

| Breakpoint (Tailwind) | Width | Layout |
|---|---|---|
| default (mobile) | ≤425px | Scoreboard top full-w, OddsMatrix collapsed, Consensus bottom full-w |
| `sm:` | 426-767px | OddsMatrix expands to right-edge w-200px |
| `md:` | 768-1023px | Scoreboard clamps to max-w-480 centered |
| `lg:` | ≥1024px | Full desktop framing |

**Rule:** Base classes (no prefix) target mobile. `sm:`/`md:`/`lg:` prefixes ADD layout at larger widths.

## Camera Permission Flow

1. On mount, check `navigator.permissions.query({ name: 'camera' })`
2. If `prompt` → show `<CameraPermissionGate>` overlay with "Enable Camera" button (44px min height)
3. On grant → mount `<video>` with `facingMode: { ideal: 'environment' }`
4. On deny / `denied` → fallback to gradient backdrop
5. On error → same fallback + console.warn

## Safe-Area Handling

```css
.hud-overlay-top { padding-top: env(safe-area-inset-top); }
.hud-overlay-bottom { padding-bottom: env(safe-area-inset-bottom); }
.hud-overlay-right { padding-right: env(safe-area-inset-right); }
```

## Performance Budget

- Max 3 concurrent `backdrop-blur` elements (the 3 HUD widgets)
- `will-change: backdrop-filter` on HUD overlays
- `contain: layout paint` on HUD overlays
- Camera `<video>` uses `object-fit: cover` (GPU-friendly)
- Mock tick cadence: 2000ms
- Target: ≥30fps on mid-range mobile (Pixel 4a / iPhone SE baseline)

## Full-Screen App Shell

```tsx
<main className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-canvas">
  <CameraBackdrop />
  <Scoreboard className="absolute top-0 inset-x-0" />
  <OddsMatrix className="absolute right-0 top-1/2 -translate-y-1/2" />
  <ConsensusIndicator className="absolute bottom-0 inset-x-0" />
</main>
```

## Future Architecture (Phase 2+)

- TxLINE live data integration (replaces mock)
- TxEdge AI Agent (risk detection)
- Solana Blinks (hedge action prompts)
- Match selection / broadcast recognition

---
*Last updated: 2026-07-06 — pre-initialization scan*
