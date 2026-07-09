# Roadmap: BlinkEdge

## Overview

BlinkEdge is a mobile-first PWA that turns your phone into an AR/HUD companion for World Cup football. The journey: ship a demoable AR HUD shell (Phase 1), add real devnet Solana Blink hedge settlement (Phase 3b), polish for the hackathon submission (Phase 3c, current), then swap mock data for real TxODDS API integration and submit (Phase 4).

Built for the **FIFA Solana 2026 Hackathon** — TxODDS "Prediction Markets and Settlement" track ($18k prize, deadline July 19, 2026).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (3b, 3c): Urgent insertions / execution-precision sub-phases

- [x] **Phase 1: Walking Skeleton** - Camera-as-canvas HUD shell with mock TxLine and 3 neon widgets
- [ ] **Phase 2: Live Data** - Replace mock with real TxODDS API; match selection; service worker
- [x] **Phase 3b: Devnet Blink Hedge** - Solana Action endpoint + risk engine + WalletProvider
- [ ] **Phase 3c: Submission Polish** - UI fixes from feedback, Blinks Inspector validation, judge packet
- [ ] **Phase 4: Real SPL Hedge** - Upgrade SystemProgram breadcrumb to real SPL vault instruction

## Phase Details

### Phase 1: Walking Skeleton
**Goal**: Ship a demoable AR companion: live rear-camera feed fills the viewport, three neon HUD widgets (Scoreboard cyan, OddsMatrix magenta, ConsensusIndicator acid) float over it with translucent `backdrop-blur(16px)`, driven by a mock TxLineProvider with deterministic 2000ms tick.
**Depends on**: Nothing (first phase)
**Requirements**: PWA-01..05, CAM-01..06, HUD-01..06, DATA-01..04, DSGN-01..08
**Success Criteria** (what must be TRUE):
  1. User can install the PWA and launch in standalone, portrait, full-screen
  2. User can grant camera permission and see their rear-camera feed as the canvas
  3. Three neon HUD widgets render over the camera with visible glow + translucent blur
**Plans**: 1 plan (10 tasks, executed as 3 atomic commits)

Plans:
- [x] 01-01: Walking Skeleton HUD shell (commits `1fde594`, `f3bca14`, `d1375d0`)

### Phase 3b: Devnet Blink Hedge
**Goal**: Ship real devnet Solana settlement: a Solana Blink Action endpoint (`GET` metadata + `POST` base64 tx) where a tap → wallet sign → confirmed flow works against Phantom/Solflare on devnet. Triggered by a pure-function risk engine with 4 declarative rules.
**Depends on**: Phase 1
**Requirements**: SOL-01..05, RISK-01..04
**Success Criteria** (what must be TRUE):
  1. User at a risk alert can tap "Hedge Now" → sign in Phantom/Solflare → see confirmation
  2. Blinks Inspector renders the Action metadata without errors
  3. All transactions use priority fees (median×2) and the devnet cluster is visually indicated
**Plans**: 1 plan (8 tasks)

Plans:
- [x] 03b-01: Devnet Blink hedge execution (commit `131a017`)

### Phase 3c: Submission Polish (current)
**Goal**: Take BlinkEdge from functional to submission-ready. Iterate on user feedback, harden the camera UX (Skip fallback), validate the Blink in Blinks Inspector, deploy a stable public HTTPS URL (Render), write the judge demo script, and produce the submission packet.
**Depends on**: Phase 3b
**Requirements**: Submission-readiness (no requirement IDs in REQUIREMENTS.md yet — planning gap)
**Success Criteria** (what must be TRUE):
  1. Live public URL renders NeonChrome UI correctly (CSS not cached-broken)
  2. Skip camera path works on desktop without a webcam
  3. Blinks Inspector returns a valid Action card with no errors
  4. Judge demo script (JUDGE_DEMO.md) exists and is reproducible
**Plans**: 1 plan (executed inline as iterative bug-fix; no PLAN.md written this phase)

Plans:
- [ ] 03c-01: Render deployment + UI polish + judge packet (commits `2bfae57`..`3d4bb73` — needs closure SUMMARY)

### Phase 2: Live Data
**Goal**: Replace `mockData.ts` with the real TxODDS TxLINE-on-Solana data stream. Add manual match selection (or broadcast recognition) as fallback. Add a service worker for offline shell. Responsive enhancement at tablet/desktop breakpoints.
**Depends on**: Phase 1
**Requirements**: LIVE-01, LIVE-02, LIVE-03, OFFL-01, OFFL-02
**Success Criteria** (what must be TRUE):
   1. App consumes live TxLINE packets via the existing `TxLineSource` interface
   2. User can select a match manually if broadcast recognition is unavailable
   3. PWA loads an offline shell from a cached service worker
**Plans**: 3 plans

Plans:
- [ ] 02-01: Data Layer Foundation — config, auth, SSE source, adapter, app state machine, provider
- [ ] 02-02: Service Worker — serwist install, offline shell, update banner, layout integration
- [ ] 02-03: UI Components — MatchSelector, ApiStatusIndicator, DataErrorBanner, page.tsx integration

### Phase 4: Real SPL Hedge
**Goal**: Upgrade the SystemProgram 1000-lamport hedge breadcrumb to a real SPL token vault instruction. Optionally add MWA v2.2.9 deep-link for mobile-only true one-tap UX. Add CI/CD pipeline (GitHub Actions runs 48 tests + typecheck on every PR).
**Depends on**: Phase 3c
**Requirements**: SOL-06+ (new REQ-IDs needed)
**Success Criteria** (what must be TRUE):
  1. The hedge tx moves a real devnet SPL token (not just rent lamports)
  2. CI gates every PR against the 48 unit tests + typecheck
  3. Mobile users can deep-link into the wallet sign flow (Phase 3b used `sendTransaction` instead)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 3b → 3c → 2 → 4 (2 deferred — Phase 3c substituted for hackathon time pressure)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Walking Skeleton | 1/1 | Complete | 2026-07-06 |
| 3b. Devnet Blink Hedge | 1/1 | Complete | 2026-07-06 |
| 3c. Submission Polish | 0/1 | In progress | - |
| 2. Live Data | 0/1 | Deferred (post-submission) | - |
| 4. Real SPL Hedge | 0/1 | Not started | - |