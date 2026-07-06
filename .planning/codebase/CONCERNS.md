---
last_mapped_commit: pre-init
mapped_at: 2026-07-06
focus: concerns
---

# Codebase Concerns

## Current State

**Status:** Pre-initialization — no code yet, no technical debt. Concerns are forward-looking risks identified during planning.

## Pre-Build Concerns

### HIGH RISK

#### 1. Camera API Permission UX (Mobile)
- **Risk:** iOS Safari requires HTTPS and prompts per-session. Users may deny.
- **Mitigation:** Permission gate with clear value proposition. Graceful fallback to gradient backdrop on denial.
- **Phase:** Phase 1

#### 2. GPU Performance (backdrop-blur over video)
- **Risk:** Three concurrent `backdrop-blur(16px)` elements over live `<video>` can drop frames on mid-range mobiles.
- **Mitigation:** `will-change: backdrop-filter`, `contain: layout paint`, max 3 blurred elements, 2000ms tick (not faster), target ≥30fps on Pixel 4a / iPhone SE.
- **Phase:** Phase 1

#### 3. Mobile Viewport Consistency
- **Risk:** `100vh` doesn't account for mobile browser chrome (URL bar show/hide). Layout jumps.
- **Mitigation:** Use `100dvh` (dynamic viewport height). `fixed inset-0` prevents scroll bounce. `overflow-hidden` locks canvas.
- **Phase:** Phase 1

### MEDIUM RISK

#### 4. Safe-Area Inset Support
- **Risk:** HUD widgets tuck under notch on iPhone 14+ or home indicator on all modern phones.
- **Mitigation:** `env(safe-area-inset-top/bottom/right)` padding on HUD overlays. `viewport-fit: cover` in meta.
- **Phase:** Phase 1

#### 5. ZOD_SCHEMAS.md Missing
- **Risk:** Phase 1 description references "TxLineEventPacket data structure from ZOD_SCHEMAS.md" but file doesn't exist.
- **Mitigation:** Hand-author ZOD_SCHEMAS.md before /gsd-plan-phase as first step.
- **Phase:** Pre-Phase 1 (resolve now)

#### 6. Rear Camera Availability
- **Risk:** Desktop devices have no rear camera. `facingMode: 'environment'` fails.
- **Mitigation:** Fallback to `facingMode: 'user'` on desktop. Log warning. Acceptable for dev/testing.
- **Phase:** Phase 1

### LOW RISK

#### 7. PWA Installability
- **Risk:** Without service worker, PWA may not be fully installable on all platforms.
- **Mitigation:** Manifest makes it installable on most platforms. Service worker deferred to Phase 2+ for offline support.
- **Phase:** Phase 1 (partial), Phase 2+ (full)

#### 8. Mock Data Determinism
- **Risk:** Non-deterministic mock data makes tests flaky.
- **Mitigation:** Seeded random or fixed event sequence. Same seed → same sequence.
- **Phase:** Phase 1

## Known Unknowns

- **TxLINE data shape:** The exact API contract for the real TxLINE stream is unknown. Phase 1 mock is our best guess based on the product doc. May need schema revision in Phase 2.
- **Broadcast recognition:** How the app knows which match the user is watching. Phase 2+ concern (manual match selection or content recognition).
- **Solana Blink implementation:** The exact Blink API for hedge execution. Phase 3+ concern.

## Monitoring (Phase 2+)

- Camera permission grant rate
- App crash rate on mid-range mobiles
- FPS on target devices (Pixel 4a, iPhone SE)
- TxLINE data latency (when integrated)

---
*Last updated: 2026-07-06 — pre-initialization scan*
