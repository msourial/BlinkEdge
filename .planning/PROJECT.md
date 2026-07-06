# BlinkEdge

## What This Is

BlinkEdge is a mobile-first PWA that turns your phone into an AR/HUD companion for World Cup football. You point your phone at the TV, and neon widgets (live score, betting odds, consensus) float over the live camera feed — the broadcast is visible through translucent panels. When critical events happen (red card, injury), the TxEdge AI Agent detects risk and offers a Solana Blink to hedge your position with one tap. Built on the TxLINE data stream on Solana.

## Core Value

A fan can see live match data floating over their TV broadcast without looking away from the game, and can protect their capital with one tap when bad events happen.

## Business Context

- **Customer**: Football fans who bet on World Cup matches and watch on TV while using a second screen
- **Revenue model**: Hedge execution fees via Solana Blinks (Phase 3+)
- **Success metric**: Camera permission grant rate + hedge tap conversion during critical events
- **Strategy notes**: Hackathon submission (FIFA Solana 2026) — judges score on Fan UX, technical complexity (risk engine), and Solana ecosystem use (Blinks)

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Mobile-first PWA: installable, standalone, portrait, full-screen (100dvh, safe-area insets)
- [ ] Camera-as-canvas: rear camera (`facingMode: environment`) fills viewport, TV broadcast visible through translucent HUD widgets
- [ ] NeonChrome design system: canvas #0a0a0f, neon cyan/magenta/acid green accents, glow-as-depth (no drop shadows), backdrop-blur(16px) HUD overlays
- [ ] TxLineProvider: in-memory mock data with deterministic 2000ms tick, simulating TxLINE event stream
- [ ] TxLineEventPacket schema: Zod-validated data structure (matchId, timestamp, minute, score, possession, events[], oddsSnapshot, consensus)
- [ ] Scoreboard HUD: top-center, card-neon (cyan), displays live score + match minute
- [ ] OddsMatrix HUD: right-edge on sm+, collapsed on mobile, card-neon-magenta, displays betting odds
- [ ] ConsensusIndicator HUD: bottom-center, card-neon-acid (green), displays market consensus
- [ ] Camera permission flow: permission gate with 44px touch target, graceful fallback to gradient on deny
- [ ] Mobile layout: ≤425px default (Scoreboard full-width top, OddsMatrix collapsed, Consensus full-width bottom), progressive enhancement at sm/md/lg
- [ ] GPU performance budget: max 3 concurrent backdrop-blur elements, will-change + contain, ≥30fps on mid-range mobile

### Out of Scope

- Live TxLINE integration — Phase 2 (mock data is sufficient for Phase 1 Walking Skeleton)
- TxEdge AI Agent (risk detection) — Phase 3 (risk engine complexity deferred)
- Solana Blinks (hedge execution) — Phase 3 (requires wallet adapter + Blink API)
- Service worker / offline support — Phase 2 (manifest makes installable now, offline deferred)
- Broadcast recognition / match selection — Phase 2 (manual match selection or content recognition)
- Database — Phase 1 is in-memory only (Walking Skeleton doesn't need persistence)
- User accounts / authentication — not needed for hackathon demo
- Backend server — Next.js API routes suffice for Phase 1 (no server needed)

## Context

**Product origin:** The product concept comes from a hackathon (FIFA Solana 2026). The product doc describes "TxHUD" — a futuristic AR companion that uses the phone camera to overlay neon widgets on the TV view. The repo is named "BlinkEdge" which is the official project/product name.

**Design system:** DESIGN.md (32KB) specifies the NeonChrome design system — a complete token set including colors (canvas, 5 neons, 5 surfaces, 3 chrome-borders, 5 inks, 4 semantics), typography (Inter + JetBrains Mono, 17 sizes), border-radius (7 scales), spacing (10 scales), glow box-shadows (8 variants), and backdrop-blur. The design doc explicitly forbids pure #000000, drop shadows, and mixing neon colors on one element.

**Camera as canvas:** The original DESIGN.md implies a dark-screen dashboard, but the product doc reveals the camera is the PRIMARY canvas. The TV broadcast must be visible through translucent HUD widgets (rgba(10,10,15,0.35) background, not the opaque 0.85 from DESIGN.md). This is a critical shift from "dashboard" to "AR companion."

**Mobile-first:** The app is specifically a mobile app, not a responsive web app. Mobile (≤425px) is the default layout. Tablet/Desktop are progressive enhancements. Safe-area insets handle notches and home indicators. 100dvh handles mobile browser chrome.

**Hackathon context:** Judges score on three criteria: Fan UX (simple AR/HUD overlay), technical complexity (risk engine using TxLINE data), and Solana ecosystem use (Blinks for hedge execution). Phase 1 establishes the Fan UX foundation.

## Constraints

- **Tech stack**: Next.js App Router + TypeScript + Tailwind CSS + Zod — required for fast hackathon dev, type safety, design token mapping, and schema validation
- **Timeline**: Hackathon submission (FIFA Solana 2026) — time-boxed, Phase 1 must be demoable
- **Compatibility**: Mobile browsers (iOS Safari 15+, Android Chrome) — camera API requires HTTPS, `facingMode: environment` for rear camera
- **Performance**: ≥30fps on mid-range mobile (Pixel 4a / iPhone SE 2nd gen baseline) — max 3 concurrent backdrop-blur elements, 2000ms tick cadence
- **Dependencies**: No external services in Phase 1 (all mock data, no DB, no live TxLINE) — Walking Skeleton principle
- **Design**: NeonChrome design system per DESIGN.md — no pure black, no drop shadows, glow-as-depth, max 1 spread-lg per viewport

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mobile-first layout (default = mobile, sm:/md:/lg: add layout) | App is specifically mobile, not responsive web — mobile is the primary use case | — Pending |
| Camera is primary canvas (not decorative backdrop) | Product doc reveals AR/HUD use case — TV broadcast visible through translucent widgets | — Pending |
| Translucent HUD backgrounds (rgba 0.35, not 0.85) | AR-over-camera requires TV visibility through widgets — shifts from dashboard to AR | — Pending |
| PWA manifest (no service worker in Phase 1) | Installable now for app feel, offline deferred to Phase 2 | — Pending |
| In-memory mock TxLineProvider (no DB) | Walking Skeleton doesn't need persistence — fastest path to demoable | — Pending |
| Zod schemas at boundary (TxLineEventPacket) | Type safety + validation for future real TxLINE integration | — Pending |
| 100dvh + fixed inset-0 app shell | Mobile browser chrome (URL bar) show/hide causes layout jumps — dynamic viewport height fixes this | — Pending |
| Safe-area insets (env() padding) | iPhone notch + home indicator would tuck HUD widgets under hardware — explicit insets required | — Pending |
| Max 3 backdrop-blur elements (GPU budget) | Three concurrent blurred overlays over live video can drop frames on mid-range mobile — hard cap prevents jank | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-06 after initialization*
