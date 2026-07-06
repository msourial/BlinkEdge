# Feature Research

**Domain:** Mobile AR/HUD second-screen sports companion for World Cup football + betting + Solana blockchain hedge execution (hackathon: FIFA Solana 2026)
**Researched:** 2026-07-06
**Confidence:** MEDIUM-HIGH (table stakes from established companion app field; differentiators inferred from project doc + verified Solana Mobile stack)

## Feature Landscape

### Table Stakes (Users Expect These)

Features a football fan expects from any "match companion" UI. Missing any of these in Phase 1 = the demo feels broken even if the AR novelty is there. For a hackathon, these are about *credibility* — judges will subconsciously compare to FotMob/Onefootball.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Live score + match clock | The whole reason a fan opens the app. Without it the overlay is decorative. | LOW | From TxLineProvider tick. Scoreboard HUD top-center (card-neon cyan). |
| Match minute / status | "45'+2", "HT", "FT", "LIVE" — fans need context for the score. | LOW | Derived from event stream minute + status enum. |
| Team identity (name + crest/colors) | Numbers without names mean nothing. Fans identify visually. | LOW | TxLineEventPacket carries matchId → team resolver. Use color tokens for crest tint, do NOT load remote images (GPU budget, perf). |
| Possession % | The single most-glanced stat during a match. Indicator of momentum. | LOW | Already in schema (`possession`). Pair with a thin neon progress bar, not a pie chart (no canvas overhead). |
| Live odds display (decimal) | Core value prop: "see odds without leaving the game." Betters expect at least one odds format. | LOW | OddsMatrix HUD (card-neon-magenta). Show 1X2 (home/draw/away) decimal. SAMPLE the mock oddsSnapshot from packet. |
| Match fixture / which match is showing | "What game am I watching?" — at minimum the user must know the match. Phase 1 = single hardcoded match is acceptable. | LOW | Phase 1: deterministic single match. Phase 2: match selector. |
| Camera permission flow with graceful deny | Camera is the canvas; deny must NOT be a dead-end. Hackathon judges often deny first. | LOW | Permission gate (44px touch target), fallback to animated gradient so app still demoable. |
| Installable PWA (manifest + standalone) | "Mobile app" framing requires home-screen installability. | LOW | manifest.json, standalone display, theme color = canvas. No SW in Phase 1. |
| Responsive/neon design system applied | Visual identity is half the hackathon score (Fan UX). | LOW | NeonChrome tokens from DESIGN.md are ready — pure CSS work. |
| Performance floor (≥30fps, capped blur) | A janky AR overlay reads as broken. | MEDIUM | Max 3 backdrop-blur elements, will-change + contain, 2000ms tick is generous. |
| Safe-area insets + 100dvh | iPhone notch and home indicator + Android URL-bar show/hide jump. Without these, widgets tuck under hardware. | LOW | env(safe-area-inset-*), dvh units. |

### Differentiators (Competitive Advantage)

These are what BlinkEdge uniquely brings. They map directly to the three hackathon scoring criteria (Fan UX / Risk Engine / Solana use). For a hackathon, **2-3 sharp differentiators beat 8 mediocre ones**.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Camera-as-canvas AR overlay** | TV broadcast visible *through* translucent HUD widgets — fan never looks away. This is the hero UX moment. | MEDIUM | `getUserMedia({video:{facingMode:'environment'}})` → `<video>` behind fixed HUD. rgba(10,10,15,0.35) translucent cards (not DESIGN.md's 0.85 — AR-over-camera is a deliberate shift). |
| **Triple-HUD composition (Score / Odds / Consensus)** | Three neon-accent cards (cyan/magenta/acid) anchor the screen — color = data type. Standout visual demo. | LOW | Already specced in PROJECT.md. Mobile: Score top full-width, Consensus bottom full-width, Odds collapsed/edge. |
| **TxEdge risk-detection AI Agent** | Detects critical events (red card, injury, goal-against) from TxLINE stream and surfaces a hedge opportunity. THIS is the "technical complexity" criteria. | HIGH | Phase 3. Needs an event classifier (rule-based or LLM) + a "risk score" derivation + trigger to surface Blink. Defer engine sophistication; start rule-based on event-type + score delta. |
| **Solana Blink hedge execution (one-tap)** | When risk detected, present a Dialect-style Blink Action rendered in-app; tap → mobile wallet adapter deep-link → sign → hedge position on-chain. THIS is the "Solana ecosystem use" criteria. | HIGH | Phase 3. Confirmed: Mobile Wallet Adapter v2.2.9 (June 2026 release, current) supports signAndSendTransaction deep-link from PWA. Blink Action URL is server-renderable; in-app render is just an Action POST → GET cycle. Must mock the hedge counter-leg (no real sportsbook API in hackathon). |
| **Market consensus indicator** | Single acid-green pulse reading "what the market thinks will happen next." Tighter, more glanceable than odds matrix. Differentiates from vanilla odds apps. | MEDIUM | Derive consensus % from oddsSnapshot (implied prob normalized) — no separate consensus feed needed. Display as a single neon dot + bar. |
| **Risk-to-Blink transition animation** | When risk triggers, animate the odds panel blooming from magenta to amber→red and the Blink CTA rising in. The "aha" moment judges remember. | MEDIUM | Glow intensity ladder (sm→md→lg) per DESIGN.md. Use Tailwind transitions + a `key`-based remount for the CTA. |
| **Stale-data warning** | If TxLine tick is missed (>2 ticks late), dim the HUD + show a caption "STREAM STALE — waiting for next event." Honest failure beats silently-stale data. | LOW | Gap-detection on timestamp vs. local clock. Adds polish judges notice. |
| **Demo mode / replay** | For judging booth — a "restart demo" button that resets mock timeline to 0'. Critical for live demos where judges join mid-flow. | LOW | Phase 1 worth-add. Hidden dev affordance. |

### Anti-Features (Commonly Requested, Often Problematic)

These are the scope-creep traps. Document them up front so Phase 1 stays a Walking Skeleton.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Broadcast content recognition (CV)** | "True AR" — point phone at TV, auto-detect which match. Sounds magical. | CV pipeline is a research project on its own. Latency, lighting, occlusion. Will eat the entire hackathon budget and likely still drift. | Phase 2: manual match select (fixture list). Phase 3+: maybe OCR of scoreboard, never full CV. |
| **Live TxLINE integration in Phase 1** | "It should show real data." | Real TxLINE production connection is undocumented territory; WebSocket auth, schema drift, rate limits, and demo-time outages are all risks. Mock data with the same Zod schema is the Walking Skeleton discipline — and lets the demo run without internet. | In-memory mock provider with 2000ms tick, deterministic seed. Migrate by swapping provider impl in Phase 2. |
| **Real wallet funds / on-chain hedge** | "Show a real hedge with real money." | Liability + UX risk; judges don't want to sign a real tx. Dev wallets can drain. Solana mainnet in a demo = ask for failure. | Devnet/mock hedge. Render the Blink Action and the wallet deep-link, but the on-chain call is a memo-only or token-mint of a "hedge voucher" NFT. Demo-safe. |
| **Real sportsbook API for odds** | True live odds would feel real. | Sportsbook APIs (Betfair/FanDuel) need auth, ToS forbids derivative use, geo-restricted, expensive. Out of scope for a hackathon. | Mock oddsSnapshot in the packet; expose a clear "Odds by TxLINE" label. |
| **User accounts / bet history** | "Persistent capital tracking." | Adds auth + DB + privacy surface. Hackathon product core is *hedging one event at a time*, not portfolio management. | Stateless. Session-only wallet connection via MWA. |
| **Service worker / full offline PWA** | "It's a PWA, right?" | SW caching of a Next.js App Router app with camera + mock stream is fiddly and a debug swamp. No offline value for an always-online demo. | manifesto-only installability in Phase 1. Defer SW to Phase 2. |
| **Push notifications / background events** | "Alert me when my team scores." | iOS PWA push gating is messy; background service workers + camera PWA is a conflict. Out of scope: app is foreground-only AR companion. | Foreground-only risk alerts via the HUD itself. |
| **Multi-match / tournament bracket view** | "It's the World Cup, show all fixtures." | Scope creep from companion → aggregator. Tonally wrong: the value is *the match you're watching right now*. | Single active match in Phase 1; match-picker in Phase 2; brackets never (link out). |
| **Speech commentary / TTS** | "Audio narration of risk events." | Adds latency, audio permission surface, and competes with TV audio. Value unclear. | Visual risk cue only (amber→red bloom + the Blink CTA label). |
| **Team-lineup / player-stat drilldown panels** | "Tap a card to expand full stats." | Drilldowns kill the AR-canvas — they cover the TV. The whole value is glance-never-leave. | Single-line compact stats only (score, possession, minute). If球迷s want deep stats, they go to Onefootball. |
| **Dark/light theme toggle** | "Let users choose." | The NeonChrome identity *is* the product. Light theme breaks the glow system (glow-on-black is the architecture). | Lock dark chrome. Refuse toggles. |
| **Custom widget layout / draggable HUD** | "Power users arrange their HUD." | Dragging widgets over a live camera is a UX research problem; default placement is part of the product design. | Fixed composition. Future Phase 3 may allow collapse/expand, not drag. |

## Feature Dependencies

```
[Camera Permission Flow]
    └──requires──> [Installable PWA + HTTPS]
    └──requires──> [Camera-as-canvas video pipeline]

[Translucent HUD Composition]
    └──requires──> [Camera pipeline active] (else it's just a dashboard)
    └──requires──> [NeonChrome design tokens applied]
    └──requires──> [GPU perf budget enforced: ≤3 backdrop-blur, ≥30fps]

[Live Score + Match Minute]
    └──requires──> [TxLineProvider (mock tick)]
    └──requires──> [TxLineEventPacket Zod schema]

[OddsMatrix HUD]
    └──requires──> [oddsSnapshot in packet]
    └──enhances──> [ConsensusIndicator] (consensus derives from odds)

[ConsensusIndicator]
    └──requires──> [OddsMatrix data]
    └──derived──> implied probability normalization

[TxEdge Risk Engine]        ←── Phase 3
    └──requires──> [TxLineEventPacket event stream]
    └──requires──> [Rule/LLM classifier on event types + score delta]
    └──produces──> [Risk payload → triggers Blink surface]

[Solana Blink Hedge]        ←── Phase 3
    └──requires──> [Risk payload from TxEdge]
    └──requires──> [Mobile Wallet Adapter deep-link installed]
    └──requires──> [Blink Action URL (server route returning Action POST)]
    └──requires──> [Mock hedge counter-leg (no real sportsbook)]
    └──enhances──> [Risk-to-Blink transition animation]

[Stale-data warning]     ──enhances──> any HUD that consumes the tick
[Demo restart button]    ──enhances──> all phases (judges re-join mid-demo)

[Broadcast content recognition] ──conflicts──> [Fixed fixture / match selection]
    (CV would *replace* manual selection; doing both doubles complexity. Pick manual.)

[Real wallet funds / on-chain hedge] ──conflicts──> [Demo-safe devnet hedge]
    (Real-fund path is a different liability surface; never combine.)
```

### Dependency Notes

- **Translucent HUD requires Camera active.** The whole product framing ("see the game through the widgets") collapses if camera is denied. The graceful gradient fallback keeps the app demoable but is a strictly worse experience — design the demo around camera-PERMITTED state.
- **OddsMatrix is upstream of ConsensusIndicator.** Consensus (%) is mathematically derived from implied probabilities of 1X2 odds. Don't fetch a separate consensus feed in Phase 1 — derive.
- **Hedge execution requires a server route.** A Blink Action is a server-rendered URL responding to GET (render) and POST (sign-and-send). Phase 1's "no backend server" constraint means hedge execution MUST wait until Phase 3 even if the UI shell could be mocked earlier.
- **Risk engine + Blink are co-dependent in Phase 3.** Building one without the other halves the score (you lose either the "technical complexity" or the "Solana use" criterion). They ship together.
- **CV recognition conflicts with manual match selection by intent, not impossibility.** Two ways to answer "which match is on screen" — building both wastes effort. Manual is the demo-reliable choice.
- **Demo restart button enhances everything.** Judges will see the demo 10+ times; a reset affordance prevents you from being hostage to the mock clock. Make it a 3-finger corner tap to hide from real users.

## MVP Definition

### Launch With (Phase 1 — Walking Skeleton)

Minimum to show the concept is real and demoable. This is what the hackathon Phase 1 must ship.

- [ ] Camera-as-canvas (rear camera fills viewport, permission flow + gradient fallback) — without it, it's not an AR companion
- [ ] Triple-HUD composition (Scoreboard cyan / OddsMatrix magenta / ConsensusIndicator acid) — the visual signature
- [ ] TxLineProvider mock with 2000ms tick, deterministic seed — drives all live data
- [ ] TxLineEventPacket Zod schema at the boundary — type safety + future-swap surface
- [ ] Installable PWA (manifest, standalone, 100dvh, safe-area insets) — "mobile app" credibility
- [ ] NeonChrome design tokens implemented (canvas #0a0a0f, three neon accents, glow box-shadows, ≤3 concurrent backdrop-blur) — Fan UX criterion
- [ ] Stale-data dimming + "restart demo" affordance — demo polish
- [ ] Mobile-first layout ≤425px default; sm/md/lg progressive — primary device target

### Add After Validation (Phase 2 — Real-data Layer)

Add once the AR shell proves itself on a phone.

- [ ] Live TxLINE WebSocket integration (swap mock provider for real one) — trigger: Phase 1 demo passes smoke test on a real device
- [ ] Match selector (fixture list of World Cup matches, manual select) — trigger: judges say "which match am I watching?"
- [ ] Service worker / offline-cached shell — trigger: demo needs to survive flaky WiFi at the booth
- [ ] Broadcast OCR of TV scoreboard (lightweight) — trigger: manual match-select friction in user testing; replaces CV

### Future Consideration (Phase 3+ — Hedge Loop)

Defer until Phase 1+2 validate that fan-WATCH surface works.

- [ ] TxEdge risk engine (rule-based classifier on event-type + score-delta first; LLM upgrade later) — the "technical complexity" criteria
- [ ] Solana Blink Action rendering in-app (Dialect-spec Action URL, server route) — the "Solana use" criteria
- [ ] Mobile Wallet Adapter deep-link signing (Phantom/Solflare) — confirmed current: MWA v2.2.9 June 2026
- [ ] Risk-to-Blink bloom transition animation — the moment judges remember
- [ ] Devnet "hedge voucher" mint on hedge (composable SPL) — demo-safe on-chain breadcrumb
- [ ] Risk-event history strip (last 3 risk events) — preserves demo narrative if a judge missed the trigger

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Camera-as-canvas overlay | HIGH | MEDIUM | P1 |
| Triple-HUD composition (Score/Odds/Consensus) | HIGH | LOW | P1 |
| TxLineProvider mock + Zod packet | HIGH | LOW | P1 |
| Live score + match minute | HIGH | LOW | P1 |
| Live odds display (1X2 decimal) | HIGH | LOW | P1 |
| Possession bar | MEDIUM | LOW | P1 |
| Team identity (name + crest color, no remote img) | HIGH | LOW | P1 |
| Installable PWA (manifest only) | MEDIUM | LOW | P1 |
| NeonChrome design tokens | HIGH | MEDIUM | P1 |
| GPU perf budget (≤3 blur, ≤30fps) | HIGH | MEDIUM | P1 |
| Safe-area + 100dvh | MEDIUM | LOW | P1 |
| Camera permission flow + gradient fallback | HIGH | LOW | P1 |
| Stale-data dimming | MEDIUM | LOW | P1 |
| Demo restart affordance | MEDIUM | LOW | P1 |
| Consensus indicator (derived from odds) | MEDIUM | LOW | P1 |
| Match fixture selector | MEDIUM | MEDIUM | P2 |
| Live TxLINE WebSocket | HIGH | MEDIUM | P2 |
| Service worker / offline shell | LOW | MEDIUM | P2 |
| Broadcast OCR (lightweight) | MEDIUM | HIGH | P2 |
| TxEdge risk engine (rule-based) | HIGH | HIGH | P3 |
| Solana Blink Action render (Dialect spec) | HIGH | HIGH | P3 |
| Mobile Wallet Adapter deep-link signing | HIGH | MEDIUM | P3 |
| Risk-to-Blink bloom transition | HIGH | MEDIUM | P3 |
| Devnet hedge-voucher mint | MEDIUM | MEDIUM | P3 |
| TxEdge event classifier LLM upgrade | LOW | HIGH | P3+ (post-hackathon) |
| Broadcast content recognition (full CV) | LOW | HIGH | P3+ (post-hackathon) |
| User accounts / bet history | LOW | MEDIUM | P3+ (post-hackathon) |

**Priority key:**
- P1: Must have for Phase 1 launch (Walking Skeleton)
- P2: Adds after Phase 1 validates the AR shell on a real phone
- P3: Hedge loop — the closing two hackathon criteria (complexity + Solana use)
- P3+: Post-hackathon ambition — documented as anti-feature for now

## Competitor Feature Analysis

| Feature | FotMob / Onefootball | 365Scores / LiveScore | Major sportsbooks (bet365, FanDuel) | Our Approach (BlinkEdge) |
|---------|----------------------|------------------------|--------------------------------------|--------------------------|
| Live score + clock | ✓ Full | ✓ Full | ✓ Full | ✓ Compact cyan HUD, glanceable |
| Possession / match stats | ✓ Deep stats panel | ✓ Deep stats panel | ✓ Match	stats	tab | ✓ Single possession bar only — AR glance, not drill-down |
| Live odds | ✗ Separate apps integrate | ✓ Some odds widgets | ✓ Full odds + bet slip | ✓ Magenta HUD, 1X2 only, no bet slip |
| Push notifications | ✓ Goal/cards/FT | ✓ Goal/cards | ✓ Bet-result alerts | ✗ Foreground only |
| Bet placement | ✗ (links out to sportsbook) | ✗ | ✓ Native bet slip + cash-out | ✗ (we HEDGE, not bet) — Blink for hedge only |
| AR camera overlay | ✗ | ✗ | ✗ | ✓ **Only we do this** — the moat |
| Risk-based hedge trigger | ✗ | ✗ | ✗ (cash-out is manual) | ✓ **Only we do this** — TxEdge AI |
| On-chain hedge execution | ✗ | ✗ | ✗ | ✓ **Only we do this** — Solana Blinks |
| Multi-tournament coverage | ✓ Wide | ✓ Wide | ✓ Wide | ✗ World Cup only; deliberate scope |
| Match video / highlights | ✓ Some | ✗ | ✓ Some | ✗ Never — competes with the AR canvas |
| Player ratings / lineups | ✓ Full | ✓ Full | ✓ Sometimes | ✗ Phase 1 — kills glanceability |

**Strategic read:** Established companion apps (FotMob, Onefootball, LiveScore) own "deep stats + multi-league + push" — that is a *mature, saturated* feature surface. Competing there is suicide for a hackathon. The three differentiators — **AR camera canvas**, **AI risk engine**, **on-chain one-tap hedge** — are each uniquely ours, and together they map exactly onto the hackathon scoring criteria. Lean into the overlap; don't dilute with feature parity.

## Sources

- **Project context:** `.planning/PROJECT.md` — validated requirements, Phase boundaries, constraints, key decisions
- **Design system:** `DESIGN.md` — NeonChrome token set, glow ladder, component catalog
- **Solana Mobile Wallet Adapter (VERIFIED):** github.com/solana-mobile/mobile-wallet-adapter — current release v2.2.9 June 2026; supports JS/Android/RN; PWA deep-link signing confirmed (HIGH confidence)
- **Dialect Blinks:** docs.dialect.xyz (fetch failed; reliance on pre-existing domain knowledge — MEDIUM confidence that Blink Action spec is stable enough for Phase 3 hackathon usage; recommend Phase 3 begin with a spike)
- **Competitor field:** FotMob, Onefootball, 365Scores, LiveScore, bet365, FanDuel — feature presence inferred from common knowledge of the app space (HIGH confidence on table-stakes list)
- **AR/HUD competitors in sports:** NFL Next Gen Stats, NBA CourtVision — broadcast-side overlays, not mobile AR; no direct mobile AR football companion at scale found (MEDIUM confidence the space is open)
- **Hackathon criteria:** PROJECT.md explicitly documents three scoring axes: Fan UX / technical complexity / Solana ecosystem use

---
*Feature research for: Mobile AR/HUD World Cup companion + betting + Solana hedge execution*
*Researched: 2026-07-06*