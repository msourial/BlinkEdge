---
last_mapped_commit: pre-init
mapped_at: 2026-07-06
focus: tech
---

# Codebase Stack

## Current State

**Status:** Pre-initialization — no application code exists yet. Only a design specification (DESIGN.md) and opencode configuration (.opencode/) are present.

## Planned Stack (from DESIGN.md + product doc)

### Core Framework
- **Next.js (App Router)** — React framework with SSR/SSG, API routes, metadata routes (manifest.ts, icon.tsx)
- **TypeScript** — Type safety, strict mode
- **React 18+** — UI library

### Styling
- **Tailwind CSS** — Utility-first CSS, custom tokens mapped from DESIGN.md
- **No component library** — Custom NeonChrome components per DESIGN.md specs

### Validation
- **Zod** — Schema validation for TxLineEventPacket data structure

### Camera/AR
- **Web Media API** — `navigator.mediaDevices.getUserMedia` for rear-camera access
- **`<video>` element** — Camera feed as primary canvas (object-fit: cover)

### PWA
- **Next.js metadata routes** — `app/manifest.ts`, `app/icon.tsx`, `app/apple-icon.tsx`
- **Web App Manifest** — Standalone display, portrait orientation, BlinkEdge theme

### Data Layer (Phase 1: Mock)
- **In-memory state** — TxLineProvider with deterministic 2000ms tick
- **Future:** TxLINE on Solana (live data stream)

### Deployment
- **Vercel** (implied by Next.js App Router) — or any Node.js host
- **HTTPS required** — Camera API requires secure context

## Design System: NeonChrome

### Color Tokens (DESIGN.md)
| Token | Value | Usage |
|-------|-------|-------|
| `canvas` | `#0a0a0f` | App background (NOT pure black — chrome undertone intentional) |
| `primary-glow` | `#00f0ff` (neon cyan) | Primary accent, Scoreboard |
| `secondary-glow` | `#ff00e5` (neon magenta) | OddsMatrix |
| `tertiary-glow` | `#39ff14` (neon acid green) | ConsensusIndicator |
| `surface` | `rgba(10,10,15,0.35)` | Translucent HUD backgrounds (AR-over-camera) |

### Typography
- **Inter** — UI body text (weights: 400, 600 only — never >400 for body)
- **JetBrains Mono** — Scores, odds, data (tabular numbers)

### Component Patterns
- **Glow-as-depth** — No drop shadows; depth via 1px neon borders + multi-layer box-shadow glow
- **backdrop-blur(16px)** — HUD overlays (max 3 concurrent for GPU perf)
- **rounded.lg (12px)** — Cards
- **rounded.md (8px)** — Buttons

## Anti-Patterns (DESIGN.md forbidden)
- No pure `#000000` (use `#0a0a0f`)
- No drop shadows (use glow)
- No two `spread-lg` elements in one viewport
- No neon color as solid background fill
- No body text weight > 400
- No body line-height < 1.5
- No `rounded.full` on cards

## Dependencies (planned)
```json
{
  "next": "^15.x",
  "react": "^18.x",
  "react-dom": "^18.x",
  "typescript": "^5.x",
  "tailwindcss": "^3.x",
  "zod": "^3.x"
}
```

## External Integrations (planned)
- **TxLINE on Solana** — Live World Cup match data stream (Phase 2+, mocked in Phase 1)
- **Solana Blinks** — Hedge action prompts (Phase 3+)
- **TxEdge AI Agent** — Risk detection engine (Phase 3+)

---
*Last updated: 2026-07-06 — pre-initialization scan*
