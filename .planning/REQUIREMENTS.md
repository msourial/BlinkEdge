# Requirements: BlinkEdge

**Defined:** 2026-07-06
**Core Value:** A fan can see live match data floating over their TV broadcast without looking away from the game, and can protect their capital with one tap when bad events happen.

## v1 Requirements

Requirements for hackathon submission. Each maps to roadmap phases.

### PWA Shell

- [ ] **PWA-01**: App is installable as PWA (manifest.ts with standalone display, portrait orientation, BlinkEdge theme)
- [ ] **PWA-02**: App fills viewport with 100dvh (dynamic viewport height), fixed inset-0, overflow-hidden
- [ ] **PWA-03**: Viewport meta includes viewport-fit=cover, maximum-scale=1 (no pinch-zoom)
- [ ] **PWA-04**: Safe-area insets applied to HUD overlays (env() padding for notch/home indicator)
- [ ] **PWA-05**: App icon and apple-icon generated via Next.js metadata routes

### Camera

- [ ] **CAM-01**: Rear camera feed fills viewport as primary canvas (getUserMedia with facingMode ideal:environment)
- [ ] **CAM-02**: Camera video uses object-fit:cover (GPU-friendly, no JS resize)
- [ ] **CAM-03**: Permission gate shows on first visit with "Enable Camera" button (44px min height)
- [ ] **CAM-04**: Permission flow checks navigator.permissions.query before prompting
- [ ] **CAM-05**: Graceful fallback to gradient backdrop on permission deny or camera error
- [ ] **CAM-06**: Camera teardown on visibilitychange (handles iOS background tab silently killing stream)

### HUD Widgets

- [ ] **HUD-01**: Scoreboard widget renders top-center with live score + match minute (card-neon, cyan #00f0ff)
- [ ] **HUD-02**: OddsMatrix widget renders right-edge on sm+ with betting odds (card-neon-magenta, #ff00e5)
- [ ] **HUD-03**: ConsensusIndicator widget renders bottom-center with market consensus (card-neon-acid, #39ff14)
- [ ] **HUD-04**: HUD backgrounds use rgba(10,10,15,0.35) — TV broadcast visible through widgets (NEVER opacity property)
- [ ] **HUD-05**: Max 3 concurrent backdrop-blur(16px) elements (GPU budget guard)
- [ ] **HUD-06**: HUD overlays use will-change:backdrop-filter and contain:layout paint
- [ ] **HUD-07**: Mobile layout (≤425px): Scoreboard full-width top, OddsMatrix collapsed, Consensus full-width bottom
- [ ] **HUD-08**: Progressive enhancement at sm/md/lg breakpoints (OddsMatrix expands, Scoreboard clamps centered)

### Data Layer

- [ ] **DATA-01**: TxLineProvider delivers mock events on deterministic 2000ms tick
- [ ] **DATA-02**: TxLineEventPacket Zod schema validates all incoming data (matchId, timestamp, minute, score, possession, events[], oddsSnapshot, consensus)
- [ ] **DATA-03**: Mock data is deterministic (same seed produces same event sequence)
- [ ] **DATA-04**: TxLineSource contract defined (decouples Phase 1 mock from Phase 2 live)
- [ ] **DATA-05**: Full event grammar supported (goal, card, injury, substitution, odds change, consensus shift)

### Design System

- [ ] **DSGN-01**: Tailwind 4 @theme block maps all DESIGN.md tokens (canvas, neons, surfaces, typography, radii, glow shadows)
- [ ] **DSGN-02**: Canvas background is #0a0a0f (never pure #000000)
- [ ] **DSGN-03**: Glow-as-depth enforced (no drop shadows, depth via 1px neon borders + multi-layer box-shadow)
- [ ] **DSGN-04**: Max 1 spread-lg element per viewport (glow intensity ladder: rest=sm, event=md, hero=lg)
- [ ] **DSGN-05**: No neon as solid background fill (neon colors for borders, text, glow only)
- [ ] **DSGN-06**: Body text Inter weight 400 (never >400), line-height ≥1.5
- [ ] **DSGN-07**: Cards use rounded.lg (12px), buttons use rounded.md (8px), never rounded.full on cards
- [ ] **DSGN-08**: Display tier clamps on mobile (36px max, steps down to 24px)

### Risk Engine

- [ ] **RISK-01**: TxEdge risk engine is a pure reducer (prevPacket, curPacket) → RiskAssessment[]
- [ ] **RISK-02**: Rules array covers: red card, injury, odds swing, lead reversal
- [ ] **RISK-03**: RiskAssessment includes severity, recommendedAction, rationale
- [ ] **RISK-04**: Risk engine is unit-testable independent of React

### Solana Integration

- [ ] **SOL-01**: Solana Blink Action endpoint (GET returns metadata, POST returns base64 transaction)
- [ ] **SOL-02**: actions.json at domain root with Access-Control-Allow-Origin: *
- [ ] **SOL-03**: Wallet adapter (autoConnect:false, simulateTransaction before send, setComputeUnitPrice always)
- [ ] **SOL-04**: One-tap hedge execution via Mobile Wallet Adapter v2.2.9 deep-link
- [ ] **SOL-05**: Devnet "hedge voucher" SPL mint as demo-safe breadcrumb

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Live Data

- **LIVE-01**: Real TxLINE on Solana data stream integration (replaces mock TxLineProvider)
- **LIVE-02**: Match selection (manual fixture select or broadcast recognition)
- **LIVE-03**: TxLINE wire protocol (SSE vs WebSocket, Last-Event-ID resumption)

### Offline

- **OFFL-01**: Service worker via @ducanh2912/next-pwa@10.2.9 (not abandoned next-pwa@5.6.0)
- **OFFL-02**: Offline shell with cached HUD layout

### Advanced Risk

- **ADVR-01**: LLM classifier upgrade for risk detection (if rule-based insufficient for judges)
- **ADVR-02**: Server-side risk inference (if client-only proves limited)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Not needed for hackathon demo — no personalization |
| Database / persistence | Phase 1 is Walking Skeleton — in-memory only |
| Backend server | Next.js API routes suffice — no separate server |
| Real wallet funds | Devnet only — real money is liability + not needed for demo |
| Real sportsbook API | Mock odds sufficient — real API is paid + complex |
| Broadcast CV recognition | Too complex for hackathon — manual match selection in Phase 2 |
| Multi-tournament support | World Cup only — scope discipline |
| Push notifications | Out of scope — focus on in-app AR experience |
| Social features | No profiles, follows, or sharing — not the product |
| Video posts / media upload | Not a content platform — companion app only |
| Real-time chat | High complexity, not core to hedge value |
| @solana/* packages in Phase 1 | Scope creep trap — Solana is Phase 3 only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PWA-01 | Phase 1 | Pending |
| PWA-02 | Phase 1 | Pending |
| PWA-03 | Phase 1 | Pending |
| PWA-04 | Phase 1 | Pending |
| PWA-05 | Phase 1 | Pending |
| CAM-01 | Phase 1 | Pending |
| CAM-02 | Phase 1 | Pending |
| CAM-03 | Phase 1 | Pending |
| CAM-04 | Phase 1 | Pending |
| CAM-05 | Phase 1 | Pending |
| CAM-06 | Phase 1 | Pending |
| HUD-01 | Phase 1 | Pending |
| HUD-02 | Phase 1 | Pending |
| HUD-03 | Phase 1 | Pending |
| HUD-04 | Phase 1 | Pending |
| HUD-05 | Phase 1 | Pending |
| HUD-06 | Phase 1 | Pending |
| HUD-07 | Phase 1 | Pending |
| HUD-08 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| DSGN-01 | Phase 1 | Pending |
| DSGN-02 | Phase 1 | Pending |
| DSGN-03 | Phase 1 | Pending |
| DSGN-04 | Phase 1 | Pending |
| DSGN-05 | Phase 1 | Pending |
| DSGN-06 | Phase 1 | Pending |
| DSGN-07 | Phase 1 | Pending |
| DSGN-08 | Phase 1 | Pending |
| LIVE-01 | Phase 2 | Pending |
| LIVE-02 | Phase 2 | Pending |
| LIVE-03 | Phase 2 | Pending |
| OFFL-01 | Phase 2 | Pending |
| OFFL-02 | Phase 2 | Pending |
| RISK-01 | Phase 3a | Pending |
| RISK-02 | Phase 3a | Pending |
| RISK-03 | Phase 3a | Pending |
| RISK-04 | Phase 3a | Pending |
| SOL-01 | Phase 3b | Pending |
| SOL-02 | Phase 3b | Pending |
| SOL-03 | Phase 3b | Pending |
| SOL-04 | Phase 3b | Pending |
| SOL-05 | Phase 3b | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-06*
*Last updated: 2026-07-06 after initial definition*
