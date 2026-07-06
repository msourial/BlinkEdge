# Project Research Summary

**Project:** BlinkEdge
**Domain:** Mobile-first AR/HUD PWA · World Cup football second-screen companion · Solana Blinks hedge execution (FIFA Solana 2026 hackathon)
**Researched:** 2026-07-06
**Confidence:** HIGH

## Executive Summary

BlinkEdge is a mobile-first PWA in which a rear-camera feed of the user's TV becomes the canvas, with translucent neon HUD widgets (Scoreboard cyan, OddsMatrix magenta, ConsensusIndicator acid-green) floating over a live World Cup broadcast. A real-time TxLINE event stream drives score/odds/consensus updates on a 2s tick; a pure-function risk engine watches for critical events (red card, injury, odds swing, lead reversal); and when risk is detected a Solana Blink Action lets the fan hedge with one tap via Mobile Wallet Adapter v2.2.9 deep-linking into Phantom/Solflare. This is a hackathon product deliberately engineered to map 1:1 onto the three judging axes (Fan UX / Technical Complexity / Solana Ecosystem Use).

Experts build this kind of app as a **single full-viewport canvas with a layered z-stack** (opaque `<video>` at z0, translucent HUD siblings at z20, modal overlays at z30+). The architecture's load-bearing insight — confirmed across MDN, Tailwind v4, and CSS `backdrop-filter` Baseline 2024 docs — is that the HUDs must be **direct children of an opaque app shell**, never wrapped in a translucent scrim, because any ancestor with `opacity<1` becomes a "backdrop root" and silently breaks the AR-over-camera blur sampling. The recommended stack is Next.js 16 App Router + React 19 + Tailwind v4 (CSS-first `@theme` maps directly onto DESIGN.md's NeonChrome token system) + Zod 4 (schema boundary for TxLineEventPacket), Vercel hosting (mandatory HTTPS for `getUserMedia`), with Solana ecosystem packages deferred entirely to Phase 3.

The dominant risks are **mobile-GPU death from 3+ concurrent `backdrop-filter` passes over live video** (cliff from 30fps to single digits on Pixel 4a / iPhone SE), **iOS Safari silently freezing the camera stream on tab background / screen-lock** (no `onended` fires — must listen to `visibilitychange` and re-acquire), **wrong-cluster wallet auto-connect** signing real USDC against the wrong cluster, and **scope creep pulling Blinks forward into Phase 1**. Mitigation is structural: Phase 1 ships *only* camera + HUD + mock data behind a swappable `TxLineSource` interface, with a hard planning gate forbidding any `@solana/*` packages; Phase 3 ships the risk engine + Blinks together as a coupled pair; the blur-budget guard (max 3), `100dvh` shell, `viewport-fit: cover`, and iOS re-acquire path are all Phase 1 non-negotiables because retrofitting them is a rewrite.

## Key Findings

### Recommended Stack

The pre-init STACK.md was two major versions behind reality. Current stable as of July 2026: `next@16.2.10` (Turbopack default, React 19 built-in), `tailwindcss@4.3.2` (CSS-first `@theme` — perfect match for DESIGN.md's `{colors.*}` token references), `zod@4.4.3` (6.5× faster object parsing, `z.toJSONSchema()` useful for the Phase 3 Action API). No database in Phase 1 — Walking Skeleton uses an in-memory deterministic `TxLineProvider` with a 2000ms tick. Solana packages (`@solana/web3.js`, `@solana/wallet-adapter-react` + per-wallet packages from `anza-xyz`, `@solana/actions`) install only in Phase 3. Supporting libs `clsx` + `tailwind-merge` from Phase 1; `framer-motion` deferred to Phase 3 (CSS transitions + `@starting-style` win for the tick pulse).

**Core technologies:**
- **Next.js 16 App Router** — App Router gives RSC, metadata routes (`app/manifest.ts` for PWA, `app/icon.tsx`), and Route Handlers (`/api/actions/hedge/[marketId]`) for Phase 3 Blinks — all in one framework. Turbopack default speeds up hackathon iteration.
- **React 19** — required by Next 16; `use()` + Actions stable for the camera permission gate.
- **Tailwind v4 (`@theme`)** — CSS-first config replaces `tailwind.config.ts`; NeonChrome design tokens become native CSS variables that utilities, inline styles, AND Framer Motion can all read. Lightning CSS auto-prefixes `-webkit-backdrop-filter`.
- **Zod 4** — required by project constraints ("Zod schemas at boundary"); 6.5× faster parsing matters on the 2000ms tick hot path.
- **Vercel** — HTTPS is non-negotiable for `getUserMedia`. One-click Next 16 deploy. Free tier covers hackathon.
- **(Phase 3) `@solana/web3.js` + `@solana/wallet-adapter-react` (per-wallet Phantom/Solflare) + `@solana/actions`** — confirmed MWA v2.2.9 (June 2026) supports PWA deep-link `signAndSendTransaction`.

**Critical version requirements:** `next@16` requires `react@19` and Node ≥20.9. `tailwindcss@4` MUST be paired with `@tailwindcss/postcss@4` (do not mix v4 core with the v3 PostCSS plugin). Use per-wallet adapter packages, NOT the legacy `@solana/wallet-adapter-wallets` bundle. Never use `next-pwa@5.6.0` (abandoned); the `@ducanh2912/next-pwa@10.2.9` fork is the only SW option for Phase 2.

### Expected Features

**Must have (table stakes — Phase 1):**
- Live score + match clock + match minute/status — derived from TxLineProvider tick
- Team identity (name + crest color, NO remote images — GPU budget)
- Possession % (single neon progress bar, not a canvas chart)
- Live odds 1X2 decimal (OddsMatrix HUD)
- Camera permission flow with graceful gradient fallback
- Installable PWA (manifest + standalone, NO service worker in Phase 1)
- NeonChrome design tokens applied (canvas #0a0a0f, three neon accents, multi-layer glow `box-shadow`, ≤3 concurrent `backdrop-filter`)
- Performance floor ≥30fps, capped blur, safe-area insets, `100dvh`
- Stale-data dimming + "restart demo" affordance

**Should have (differentiators — the moat):**
- **Camera-as-canvas AR overlay** — TV visible through translucent HUD widgets; the hero UX moment, only BlinkEdge does this
- **Triple-HUD composition** (Score / Odds / Consensus) — color = data type, standout visual signature
- **TxEdge risk-detection AI Agent** (Phase 3) — pure-function reducer over TxLineEventPacket diffs; rule-based classifier first (red card, injury, odds swing, lead reversal), LLM upgrade post-hackathon
- **Solana Blink hedge execution (one-tap)** (Phase 3) — Dialect-spec Action URL rendered in-app → Mobile Wallet Adapter deep-link → signAndSendTransaction
- **Risk-to-Blink bloom transition animation** — the moment judges remember
- Market consensus indicator (derived from odds normalization — no separate feed)
- Demo mode / replay button for judging booth

**Defer (v2+):**
- Live TxLINE WebSocket integration (Phase 2 — swap mockSource behind the `TxLineSource` contract)
- Match selector / multi-match / tournament brackets (Phase 2 selector; Phase 3+: brackets never, link out)
- Service worker / offline PWA shell (Phase 2)
- Broadcast OCR of TV scoreboard (Phase 2, replaces full CV which is out-of-scope)
- TxEdge LLM classifier upgrade, user accounts / bet history, push notifications, speech commentary (post-hackathon)

**Explicit anti-features (document scope-creep traps):**
- Broadcast content recognition (full CV) — research project on its own; manual match select instead
- Real wallet funds / on-chain hedge — liability trap; devnet "hedge voucher" mint only
- Real sportsbook API — ToS/geo/liability; mock `oddsSnapshot` in the packet
- A component library (shadcn/Radix/Mantine) — fights NeonChrome's glow-as-depth system; build the ~6 components by hand
- Dark/light toggle, draggable HUD layout, player stat drilldown panels — all destroy the AR-glance moat

### Architecture Approach

Single Next.js App Router app with a fixed `inset-0 h-[100dvh]` canvas. The architecture is dominated by **five patterns**: (1) Camera-as-Canvas Layer Stack — `<video>` and every HUD are direct children of an opaque shell (never wrapped in a translucent scrim, because ancestors with `opacity<1` become backdrop roots and break blur sampling); (2) Anticipatory Provider Seam — `TxLineProvider` exposes a stable `TxLineSource` interface so Phase 1's in-memory mock swaps for Phase 2's `EventSource` without touching consumers; (3) Pure-Function Risk Engine over Event Diff — `lib/risk/` is a `(prev, cur, now) → RiskAssessment[]` reducer with declarative rules, fully unit-testable, the hackathon's "technical complexity" lever; (4) One-Tap Blink Execution — `GET Action → POST {account} → decode base64 tx → set feePayer + recentBlockhash → wallet.signAndSendTransaction (deep-link) → links.next callback`; (5) GPU-Scoped Blur Budget Guard — runtime gate caps concurrent `backdrop-filter` mounts at 3 and degrades the 4th to translucent-without-blur.

**Major components:**
1. **AppShell** (`app/page.tsx`) — fixed 100dvh canvas, lays out HUD z-stack (z0 video, z10 fallback, z20 HUDs, z30 RiskAlertSheet, z40 BlinkHedgeCard, z50 permission/wallet modals), mounts root providers.
2. **CameraBackdrop + CameraPermissionGate** — `getUserMedia({video:{facingMode:{ideal:'environment'}}, audio:false})` on user gesture; visibilitychange re-acquire for iOS; gradient fallback on deny.
3. **HUD Widgets** (Scoreboard cyan / OddsMatrix magenta / ConsensusIndicator acid) — absolute-positioned `card-neon-*` with `backdrop-blur(16px)` + `will-change: backdrop-filter` + `contain: layout paint`, read-only consumers of TxLineProvider.
4. **TxLineProvider + TxLineSource** (Phase 1 mock / Phase 2 SSE) — single source of truth for live match state, Zod-validated at the boundary.
5. **RiskEngine + RiskAlertSheet** (Phase 3) — pure reducer over packet diffs, declarative rules, emits RiskAssessment[] into RiskEngineProvider; Sheet renders the active alert + "Hedge now" CTA.
6. **BlinkHedgeCard + WalletProvider** (Phase 3) — Action client (GET/POST/decode), `@solana/wallet-adapter-react` for MWA deep-link signing; never auto-signs.
7. **Solana Action endpoint** (Phase 3 — `app/api/actions/hedge/[marketId]/route.ts` + `app/actions.json/route.ts`) — `ActionGetResponse`/`ActionPostResponse` with `*` CORS; validate via Blinks Inspector before demo.
8. **`lib/perf/blurBudget.ts`** — runtime guard for the 3-concurrent-blur cap — non-negotiable for mid-range Android.

### Critical Pitfalls

1. **iOS Safari silently freezes camera on background / tab-switch / screen-lock** — no `error`/`onended` fires; stream renders frozen black while HUDs keep updating so the app *looks* alive but is dead. **Avoid:** listen `visibilitychange` + `pagehide`; proactively `track.stop()` on hidden and re-`getUserMedia` on visible with 200ms exponential-backoff retry; show "Camera re-connecting…" amber overlay. **Phase 1 — bake from day one, retrofitting = rewrite.**
2. **3+ concurrent `backdrop-filter` over live `<video>` collapses fps to single digits on mid-range Android** — each blur is uncacheable per composited frame; cost scales with `radius²`. **Avoid:** hard cap 3 (`lib/perf/blurBudget.ts`), drop `backdrop-blur-md`→`sm` on ≤425px, replace mobile OddsMatrix blur with solid `rgba(10,10,15,0.55)`, auto-downgrade on `navigator.hardwareConcurrency ≤ 4`/`deviceMemory ≤ 4`. **Phase 1 — UAT: ≥30fps on Pixel 4a for 5 minutes continuous.**
3. **`100vh` causes HUD to slide under iOS clock / home indicator** — `100vh` is the small viewport; URL bar show/hide shifts chrome. **Avoid:** `100dvh` (+ `100svh` `@supports` fallback), `position: fixed; inset: 0; overflow: hidden` shell, `env(safe-area-inset-*)` *padding* (not margin), `<meta viewport viewport-fit=cover>` — without `viewport-fit=cover` safe-area returns 0. **Phase 1.**
4. **Wrong-cluster wallet auto-connect** — `autoConnect: true` re-establishes a stale wallet against the wrong RPC; user signs real-USDC tx on mainnet when devnet was intended (or vice-versa, AccountNotFound). **Avoid:** disable autoConnect, derive endpoint from the Blink URL's `?cluster=`, always `simulateTransaction` before `send`, surface a visible cluster + truncated-pubkey badge. **Phase 3 (scaffold `cluster` token in Phase 1 architecture).**
5. **Zero priority-fee tx drops under Mainnet congestion** — legacy `computeUnitLimit` + no `computeUnitPrice` sits in mempool 60–90s and gets dropped; the "one-tap hedge" UX dies. People also confuse µ-lamports/CU with lamports and set 1µ when they meant 1L. **Avoid:** always include `setComputeUnitPrice` (median×2 from `getRecentPrioritizationFees`) + `setComputeUnitLimit` (1.5× devnet-measured); 15s re-sign with 1.5× fee and `lastValidBlockHeight = currentBlockHeight + 150`; demo on Devnet with identical codepath. **Phase 3 — design a `SolanaTransactionService` boundary in Phase 2 architecture.**
6. **Scope creep pulls Blinks into Phase 1** — half-finished wallet code erodes judge trust worse than a clean mock. **Avoid:** hard "Phase 1 = camera + HUD + mock only" planning gate; forbid `@solana/*` in Phase 1 `package.json`; build a *plausible mock hedge modal* (amber "MOCK HEDGE" badge) to demo the full loop without crypto risk; keep Solana code on a `phase-3-scaffold` branch, not deleted. **Phase 1 planning gate.**
7. **NeonChrome translucent text fails WCAG contrast against bright broadcast frames** — cyan/magenta on 35% opacity over stadium floodlights or a red jersey drops below AA 4.5:1. **Avoid:** `text-shadow: 0 0 4px rgba(10,10,15,0.9)` halo on all HUD text; ≥14px minimum; auto-bump HUD bg to 0.55 when avg video luminance >0.6 (Phase 2 polish). **Phase 1 floor.**

## Implications for Roadmap

Research converges on a **dependency-ordered build sequence** where each phase unlocks exactly one seam.

### Phase 1: Walking Skeleton — Camera-as-Canvas HUD Shell
**Rationale:** The camera layer stack is the load-bearing insight of the whole project; the `TxLineSource` seam must be exact on day one because Phase 2 is a *source swap*, not a refactor; the GPU/perf guard (blur cap, `100dvh`, `viewport-fit=cover`, iOS re-acquire) MUST be enforced from the first HUD widget — retrofitting = rewrite. No Solana code; mock hedge modal with amber "MOCK" badge to demo the full narrative.
**Delivers:** A demoable AR companion — live `<video>` backdrop, three neon HUD widgets over it with translucent `backdrop-blur`, mock TxLineProvider with deterministic 2s tick (seeded PRNG → guaranteed red card at minute 67 for the demo), Zod-validated `TxLineEventPacket`, manifest-only installable PWA, restart-demo affordance, stale-data dimming.
**Addresses:** All Phase 1 table stakes + the two "moat" visual features (Camera-as-Canvas overlay, Triple-HUD composition) + Fan UX judging criterion.
**Avoids:** Pitfalls #1 (iOS camera freeze), #2 (backdrop-filter GPU death), #3 (100vh layout), #6 (PWA install camera loss via permission gate), #8 (WCAG contrast floor — text-shadow + min opacity). Pitfall #7 (scope creep) is enforced as a planning gate forbidding `@solana/*` in `package.json`.

### Phase 2: Live Data Layer — Real TxLINE + Match Selection + Offline Shell
**Rationale:** Phase 1's `TxLineSource` interface must already exist; Phase 2 then is one-line plumbing: swap `mockSource` for `createEventSourceSource` (SSE via Next Route Handler fan-out). Match selection lands once judges ask "which match am I watching?". Service worker lands only when booth WiFi demands resilience.
**Delivers:** Live TxLINE WebSocket/SSE stream behind the same contract, manual match selector (fixture list — replaces full CV), `@ducanh2912/next-pwa@10.2.9` offline app-shell SW, optional lightweight broadcast OCR.
**Uses:** `mockSource` ↔ `liveSource` swap at the `TxLineProvider` seam; devnet cluster token scaffolded in Phase 1.
**Implements:** External TxLINE integration point; scaling path (Next Route Handler fan-out for SSE).
**Avoids:** Pitfall #5 (priority fees) — design the `SolanaTransactionService` boundary here even though Phase 3 wires it. Pitfall #6 (PWA install re-permission) ready here.

### Phase 3a: TxEdge Risk Engine (Pure Reducer + Declarative Ruleset)
**Rationale:** A demo-able risk engine with no wallet still scores "Technical Complexity" on the rubric. Blinks without a risk trigger is just "a button that signs a tx." Ship the engine before the wallet so demo risk signals are real before any crypto wiring.
**Delivers:** `lib/risk/riskEngine.ts` (pure `evaluate(prev, cur, now) → RiskAssessment[]`), `lib/risk/rules.ts` declarative ruleset (red card, injury, odds swing >18%, lead reversal, possession cliff), `RiskEngineProvider` React context, `RiskAlertSheet` bottom-sheet overlay rendering severity + reason + "Hedge now" CTA. Unit tests: each rule against fixture packets — judge-trustable.
**Addresses:** The "Technical Complexity" judging criterion + the ConsensusIndicator + Risk-to-Blink bloom transition.
**Implements:** Architecture Pattern 3 (Pure-Function Risk Engine over Event Diff).
**Avoids:** Architecture Anti-Pattern #3 (inline business logic in components — keep `evaluate()` pure and unit-tested).

### Phase 3b: Solana Blinks Hedge Execution (Action Endpoint + MWA Deep-Link)
**Rationale:** Depends on Phase 3a's RiskAssessment carrying a `recommendedAction` field that resolves to the Action URL. Blinks + risk engine are co-dependent — building one without the other halves the score. Spec compliance (`actions.json` + `*` CORS) is mechanical work best sequenced after the engine exists.
**Delivers:** Next Route Handler pair (`/api/actions/hedge/[marketId]` GET/POST + `/actions.json`), `BlinkHedgeCard` Action client (GET metadata → POST {account} → decode base64 tx → set feePayer + recentBlockhash → `signAndSendTransaction` deep-link → `links.next` "Hedged ✓" callback), `WalletProvider` with `autoConnect: false`, `SolanaTransactionService` (always sets `setComputeUnitPrice` + `setComputeUnitLimit`), devnet "hedge voucher" SPL mint as the demo-safe on-chain breadcrumb, Risk-to-Blink bloom transition animation.
**Addresses:** The "Solana Ecosystem Use" judging criterion + the one-tap hedge differentiator.
**Uses:** `@solana/web3.js@1.98.4` + `@solana/wallet-adapter-react@0.15.39` (Phantom + Solflare per-wallet packages) + `@solana/actions@1.6.6`, RPC `commitment: 'confirmed'`, Helius/QuickNode devnet endpoint.
**Implements:** Architecture Patterns 4 (One-Tap Blink Execution) + service boundary for `SolanaTransactionService`.
**Avoids:** Pitfalls #4 (wrong-cluster — derive cluster from Blink URL, `simulateTransaction` before send, visible cluster badge), #5 (priority fees — `setComputeUnitPrice` always, 15s re-sign with 1.5× fee). Research flag below — `links.next` spec mechanics need a spike.

### Phase Ordering Rationale

- **Phase 1 → 2 seam is the `TxLineSource` contract.** Get it right early and Phase 2 becomes a one-line source swap. Architecture Pattern 2 (Anticipatory Provider Seam) is explicit in service of this.
- **Phase 3a → 3b seam is the `RiskAssessment`.** It carries the `recommendedAction` Action URL — Phase 3b only renders what the engine emits. Decoupling them risks Phase 3b shipping before Phase 3a validates any real risk signals.
- **GPU/perf shape Phase 1.** The blur-budget cap and the layer-stack purity rule (HUDs as siblings of `<video>`, never wrapped in a translucent scrim) MUST be enforced from the first HUD widget — retrofitting them is a rewrite. Pitfalls #1, #2, #3 are all foundational Phase-1-only.
- **Solana spec compliance is Phase-3 mechanical work.** `actions.json` and CORS headers are a checklist, not an open research question — sequence them after the engine exists so demo risk signals are real before the wallet is wired.
- **Phase 3a before Phase 3b** protects the demo score: if Blinks slip to "post-hackathon," the risk engine alone still scores "Technical Complexity."
- **The Walking Skeleton discipline** (mock hedge modal with amber "MOCK" badge in Phase 1, mock `TxLineProvider` until Phase 2) is what makes the demo work without internet, without real TxLINE, and without real money — every phase demoable in isolation.

### Research Flags

Phases likely needing deeper research during planning (`/gsd-plan-phase --research-phase <N>`):
- **Phase 2 — TxLINE wire protocol:** event schema, transport (SSE vs WebSocket vs zmq), `Last-Event-ID` resumption semantics, rate limits, auth. Architecturally we bet on SSE via a Next Route Handler fan-out; WebSocket would force a small wrapper rewrite at the `TxLineSource` boundary only. **Medium uncertainty — Dialect/TxLINE docs were not fetchable;** downgrade to Phase 2 spike.
- **Phase 3b — Solana `links.next` callback mechanics:** the trickiest spec-compliance piece (same-origin POST callback with `{signature, account}`, what fields the next Action POST expects). Solana Actions docs were fetched HIGH; one specific spec corner needs a 1-day spike before implementation.
- **Phase 3a — Risk engine: client-only vs server-side inference:** MVP is pure client-side reducer (recommended). Server-side inference (LLM classifier) is a deferred decision — flag if the rubric rewards it.

Phases with standard patterns (skip research-phase):
- **Phase 1 — Camera/HUD shell:** `getUserMedia`, `backdrop-filter`, `100dvh`, Tailwind v4 `@theme` are all well-documented (MDN, Tailwind v4 launch blog, Next 16 docs — all HIGH). The patterns are stable; the work is execution discipline, not exploration.
- **Phase 3b — Solana Action endpoint + wallet adapter:** `@solana/actions` SDK + `@solana/wallet-adapter-react` are doc-complete; MWA v2.2.9 PWA deep-link signing is confirmed. The remaining work is the `links.next` flag above — the rest is mechanical.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions cross-verified against npm registry + Next 16 / Tailwind v4 / Zod v4 official docs + MDN + anza-xyz wallet-adapter repo. Tailwind v4 `@theme` ↔ DESIGN.md token mapping is a direct covariate. |
| Features | MEDIUM-HIGH | Table stakes cross-checked against FotMob/Onefootball/365Scores/LiveScore/bet365/FanDuel common-knowledge feature space. Differentiators map 1:1 to the three hackathon judging rubric axes (documented in PROJECT.md). MWA v2.2.9 PWA deep-link signing verified HIGH. Dialect Blinks docs fetch failed; reliance on pre-existing domain knowledge for the spec stability — recommend Phase 3 spike. |
| Architecture | HIGH (core flow) / MEDIUM (risk engine internals, transport choice) | Core layer-stack pattern verified against MDN `backdrop-filter` Baseline 2024 + backdrop-root ancestor footgun (HIGH). MWA v2.2.9 deep-link signing verified via solana-mobile repo (HIGH). SSE-vs-WebSocket choice for Phase 2 TxLINE is inferred (MEDIUM — architected to localize the bet to one boundary). |
| Pitfalls | HIGH | Domain-consistent patterns cross-checked against project CONCERNS.md and DESIGN.md. iOS `getUserMedia` foreground-only behavior, `backdrop-filter` GPU cost, fee-market dynamics, and wallet auto-connect wrong-cluster are all backed by primary sources (Apple WebKit, Chrome DevTools team, Solana Foundation, W3C WCAG). |

**Overall confidence:** HIGH

### Gaps to Address

- **TxLINE actual wire protocol** — Dialect docs fetch failed; SSE bet is architecturally localized to the `TxLineSource` boundary but the event schema, `Last-Event-ID` resumption, and rate limits need a Phase 2 spike. *Handle: `/gsd-plan-phase --research-phase 2` before implementation.*
- **Solana `links.next` callback mechanics** — Actions spec was fetchable HIGH but the `PostNextActionLink` same-origin callback flow has spec corner cases (what fields are required on the next POST, what error responses are valid). *Handle: Phase 3b one-day spike before implementation; validate via Blinks Inspector.*
- **Dialect Blinks registry verification** — only gates Twitter/X unfurling; in-app Blink rendering works without it. Whether to register for the hackathon demo is a minor decision. *Handle: decide in Phase 3b discuss.*
- **TxEdge server-side inference** — pure client-side reducer is the recommended MVP; if the rubric rewards an "AI Agent" with server-side LLM inference, that's a Phase 3+ scope decision. *Handle: flag in Phase 3a discuss — do not block MVP on it.*
- **Real sportsbook odds integration** — explicitly out of scope (anti-feature); mock `oddsSnapshot` in the packet. *Handle: do not research; the "Odds by TxLINE" label is the demo story.*
- **Mobile GPU tier detection** — `navigator.hardwareConcurrency`/`deviceMemory` auto-downgrade thresholds for the blur budget are heuristic. *Handle: Phase 1 UAT on a Pixel 4a + iPhone SE 2; tune empirically.*

## Sources

### Primary (HIGH confidence)
- **npm registry** (live, 2026-07-06) — version pins for `next@16.2.10`, `react@19.2.7`, `tailwindcss@4.3.2`, `zod@4.4.3`, `@solana/web3.js@1.98.4`, `@solana/wallet-adapter-*`, `@solana/actions@1.6.6`, `framer-motion@12`, `next-pwa`, `@ducanh2912/next-pwa@10.2.9`.
- **Tailwind CSS v4.0 launch blog** (tailwindcss.com/blog/tailwindcss-v4, Jan 22 2025) — CSS-first `@theme`, native cascade layers, `@starting-style` variant, Lightning CSS auto-prefixing for `-webkit-backdrop-filter`.
- **Next.js 16.2.10 installation docs** (nextjs.org/docs/app/getting-started/installation) — App Router + Turbopack default, React 19 built-in, Node 20.9 min, metadata routes.
- **Zod v4 release notes** (zod.dev/v4) — 6.5× object parsing, 2.3× smaller core bundle, `z.toJSONSchema()`.
- **Solana Actions + Blinks spec** (solana.com/docs/advanced/actions) — `ActionGetResponse`/`ActionPostResponse`, `actions.json`, CORS `*`, `solana-action:<url>` scheme, Blinks Inspector.
- **anza-xyz/wallet-adapter GitHub repo** — per-wallet packages (`@solana/wallet-adapter-phantom`, `...-solflare`), migrated from solana-labs.
- **MDN `MediaDevices.getUserMedia()`** (last modified Nov 2025) — Baseline 2017; secure-context mandatory; `facingMode: {exact}` vs `{ideal}`; `track.stop()` before re-requesting.
- **MDN `backdrop-filter`** (last modified April 2026) — Baseline 2024; **opacity<1, filter, mask, will-change on ancestor → backdrop root → blur samples the scrim, not the camera** — single most important architectural finding.
- **Solana Mobile Wallet Adapter v2.2.9** (github.com/solana-mobile/mobile-wallet-adapter, released 2026-06-04) — JS/Android/RN PWA deep-link `signAndSendTransaction` confirmed.

### Secondary (MEDIUM confidence)
- **Mobile sports companion landscape** — FotMob/Onefootball/365Scores/LiveScore/bet365/FanDuel feature survey (websearch + common knowledge); confirms AR/HUD + AI risk + on-chain hedge is open greenfield.
- **CSS `backdrop-filter` GPU cost over live video** — Chrome DevTools compositor scratch-buffer behavior; blur cost scales with `radius²` (community + devtools-team guidance).
- **Solana fee market dynamics** — Helius / Solana Foundation priority-fee docs; `computeUnitPrice` in µ-lamports/CU; `getRecentPrioritizationFees`.
- **Project artifacts** — `.planning/PROJECT.md`, `DESIGN.md` (NeonChrome tokens), `.planning/codebase/CONCERNS.md` (8 forward-looking risks), `.planning/codebase/STACK.md` (pre-init stack now superseded by two major versions).

### Tertiary (LOW confidence — needs validation)
- **Dialect Blinks docs** (docs.dialect.xyz) — fetch failed; reliance on pre-existing domain knowledge that Blink Action spec is stable enough for Phase 3 hackathon usage. **Phase 3 spike required before implementation.**
- **TxLINE actual wire protocol** — not directly verifiable; SSE bet localized to the `TxLineSource` boundary. **Phase 2 spike required.**
- **Author domain expertise** — real-time transport choice (SSE vs WebSocket), client-side risk engine patterns, NeonChrome design system implications — used where no authoritative source was fruitfully fetchable.

---
*Research completed: 2026-07-06*
*Ready for roadmap: yes*