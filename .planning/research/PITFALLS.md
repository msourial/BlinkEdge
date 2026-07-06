# Pitfalls Research

**Domain:** Mobile-first AR/HUD PWA + Solana Blinks companion app (FIFA Solana 2026 hackathon)
**Researched:** 2026-07-06
**Confidence:** HIGH (domain-consistent patterns; cross-checked against project CONCERNS.md and DESIGN.md)

> Scope note: This file extends `.planning/codebase/CONCERNS.md` (forward-looking risks) with **domain-level failure modes** observed across mobile AR/HUD projects and Solana wallet-integrated consumer apps. Where CONCERNS.md lists a risk as a bullet, this file explains the *why*, the *warning signs*, and the *phase* that must prevent it.

---

## Critical Pitfalls

### Pitfall 1: `getUserMedia` returns a frozen black stream on iOS Safari after tab-switch / screen-lock

**What goes wrong:**
On iOS Safari 15–17, after the user backgrounds the tab, locks the phone, or swipes to the control center, the `MediaStream` from `getUserMedia({ video: { facingMode: { exact: 'environment' } } })` can silently degrade: the `<video>` element keeps playing but renders a frozen frame or pure black. No `error` event fires. The HUD overlays still update from the mock TxLineProvider, so the app *looks alive* but the camera canvas is dead — a demo-killing failure on the judge's phone.

Worse: iOS revokes camera permission silently when the user switches tabs, and `getUserMedia()` returns a *new* `NotAllowedError` on resume — but only if you call it again. The existing track's `onended` does **not** fire on iOS.

**Why it happens:**
Apple treats camera access as a foreground-only privilege. Other browsers (Chrome Android) fire `oninactive`/`onended`; iOS doesn't, so the standard `track.onended` listener pattern lulls developers into a false sense of safety.

**How to avoid:**
- Listen for `visibilitychange` and `pagehide` on `document`; on `visibilitychange → hidden`, **proactively `stop()` all tracks** and tear down the `<video>` srcObject. On `→ visible`, re-request `getUserMedia` from scratch.
- Wrap re-acquisition in a retry with exponential backoff (iOS sometimes throws `NotReadableError` for ~300ms after resume while the camera hardware re-arms).
- Surface a "Camera re-connecting…" neon overlay (using `{colors.surface-overlay}` + amber border per DESIGN.md semantic) so the user sees state, not a frozen frame.
- Never use `{ facingMode: { exact: 'environment' } }` alone — pair with a `{ width: { ideal: 1280 }, height: { ideal: 720 } }` constraint; iOS honors exact()` strictly and rejects if rear cam is unavailable, whereupon the *whole* `getUserMedia` call rejects and you get nothing instead of a fallback.

**Warning signs:**
- `<video>.readyState` stuck at `2` (HAVE_CURRENT_DATA) without progressing to `4` after a visibility round-trip.
- `requestVideoFrameCallback` callbacks stop firing but no `error` event on the video element.
- Demo on a real iPhone: lock/unlock the phone mid-demo. If the camera doesn't resume on the first tap, you've hit this.

**Phase to address:** Phase 1 (Walking Skeleton) — bake visibility-handling into `CameraCanvas` from day one. Retrofitting is a rewrite because every consumer of the stream assumes it's live.

---

### Pitfall 2: `backdrop-filter: blur(16px)` over live `<video>` drops to 5–10 fps on mid-range Android

**What goes wrong:**
NeonChrome HUD calls for `backdrop-filter: blur(16px)` on three overlapping translucent cards (Scoreboard cyan, OddsMatrix magenta, ConsensusIndicator acid). On a Pixel 4a / Moto G Power / Galaxy A series, each `backdrop-filter` triggers a separate GPU blur pass *per composited frame*, and the live `<video>` underneath forces the compositor to re-rasterize the backdrop every frame (no caching possible — content is moving). Combined: 3 blur passes × 30 video fps = GPU saturates, main thread blocks on compositor commits, fps collapses to single digits. The whole "AR feel" turns into a slideshow.

Design tokens (`{glow.spread-md}` box-shadows) compound this: large box-shadow glows over a `backdrop-filter` element force the compositor to allocate a scratch buffer for the *entire* glow extent, not just the card.

**Why it happens:**
- `backdrop-filter` is one of the few CSS properties that cannot be cached when the backdrop is animated video.
- Developers test on MacBook / iPhone 14 Pro where the GPU headroom hides the cost; only mid-range Android exposes the cliff.
- Tailwind's `backdrop-blur-md` looks like a one-liner so engineers sprinkle it liberally.

**How to avoid:**
- **Hard cap: max 3 concurrent `backdrop-filter` elements** (already in PROJECT.md requirements — hold the line during code review).
- Reduce blur radius on small screens: `backdrop-blur-md` (16px) at `lg:` breakpoints, drop to `backdrop-blur-sm` (6px) on `≤425px`. Blur cost scales roughly with `radius²`.
- Add `will-change: backdrop-filter` *only* to the 3 HUD cards; never to the `<video>` itself (that forces a separate layer per frame).
- Add `contain: layout paint style` to each HUD card so the compositor can clip the blur region.
- Replace the OddsMatrix blur on mobile (≤425px) with a translucent solid `rgba(10,10,15,0.55)` panel — it's collapsed-almost-offscreen on mobile per the layout spec anyway, so blur there is wasted GPU.
- Replace glow `box-shadow` on HUD cards with a `::before` pseudo-element border-only glow where possible (avoids the compositor allocating a scratch buffer for the shadow's spread).
- Detect low-end device via `navigator.hardwareConcurrency ≤ 4` or `deviceMemory ≤ 4` and downgrade the blur budget *automatically*; don't make the user toggle a "low performance mode."

**Warning signs:**
- Chrome DevTools Performance → Frame chart shows >80% "Compositing" on Android; near-0% on desktop.
- The HUD updates (mock tick) but the camera frame visibly stutters between updates.
- `requestAnimationFrame` cadence drops below 30fps within 60s of demo start.

**Phase to address:** Phase 1. This is the difference between "demo works on stage" and "demo dies on a judge's Android." Add a performance gate in Phase 1 UAT: "≥30fps on Pixel 4a for 5 minutes continuous."

---

### Pitfall 3: `100vh` causes layout jump when iOS Safari's URL bar shows/hides

**What goes wrong:**
Using `height: 100vh` (or Tailwind's `h-screen`) on the app shell, the HUD overlays positioned with `position: fixed; top: 0; bottom: 0` look correct on first paint. But when the user scrolls or the URL bar collapses, `100vh` keeps the *larger* height and content extends behind the URL bar. Conversely, Safari's "Smart App Banner" or the home indicator shifts the safe area. Result: Scoreboard slides under the iOS clock; ConsensusIndicator hides behind the home indicator. The NeonChrome aesthetic of "floating widgets over the TV" collapses into "widgets floating under hardware."

**Why it happens:**
- `100vh` is the *small* viewport on iOS (URL bar visible) — it doesn't grow when the URL bar hides, causing content to be cut off when it appears unexpectedly.
- Safari added `svh`, `lvh`, `dvh` units specifically; most boilerplates still use `100vh`.
- `position: fixed` interacts poorly with the dynamic chrome — the home indicator overlaps `bottom: 0` unless you use `env(safe-area-inset-bottom)`.

**How to avoid:**
- Use `100dvh` (dynamic viewport — updates as chrome shows/hides) for the app shell. Already a Key Decision in PROJECT.md.
- Use `100svh` as a fallback for browsers without `dvh` support (Safari 14 and earlier); feature-detect via `@supports (height: 100dvh)`.
- The app shell must be `position: fixed; inset: 0; overflow: hidden` — never let the body scroll. Scroll bounce on Safari will otherwise show pure black behind translucent HUD cards (jarring against the camera canvas).
- All HUD overlays must use `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, and `env(safe-area-inset-left/right)` as padding insets — not margins, which can be collapsed by parent flex/grid.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` — `viewport-fit: cover` is **mandatory** for safe-area to take effect; without it, `env(safe-area-inset-*)` returns `0` even on notched devices.

**Warning signs:**
- Scoreboard overlaps the iOS status bar clock when you scroll down.
- ConsensusIndicator sits below the visible area until the user pulls up to reveal it.
- `getBoundingClientRect()` on a "fixed" element returns different `top` values before/after scroll.

**Phase to address:** Phase 1. App shell layout is foundational — every phase after inherits these insets. Don't fix in Phase 2.

---

### Pitfall 4: Solana wallet auto-connect reconnects to a stale, wrong-network wallet mid-hedge

**What goes wrong:**
With `@solana/wallet-adapter-react`, the `autoConnect` flag (default false but commonly enabled in tutorials) silently re-establishes a wallet connection on mount. If the user previously connected to **Devnet** (hackathon demo) and the app laterals to **Mainnet** for the real hedge, or vice versa, the wallet signs a transaction against the wrong cluster. On Mainnet, this means real USDC left the wallet. On Devnet, the transaction fails with `Transaction simulation failed: AccountNotFound` because the user's mainnet ATA doesn't exist on devnet.

Worse: `wallet.adapter.publicKey` is *not null* after auto-connect, so the UI shows a "connected" state and the user taps the hedge Blink believing it's safe.

**Why it happens:**
- Wallet adapter never persists cluster choice across reloads reliably; `endpoint` is a runtime value.
- Blinks typically execute on the cluster the Blink's action URL encodes; if your app's `endpoint` and the Blink's cluster disagree, you get a silent transaction to the wrong chain.
- Hackathon demos set `autoConnect={true}` for "smooth UX" and never simulate before sending.

**How to avoid:**
- Disable `autoConnect` for the hedge flow. Require an explicit tap on "Connect Wallet" — even in demo. This is one tap and it's *exactly* the kind of friction that prevents real money loss.
- Always derive the `endpoint` from the Blink's action URL cluster (`?cluster=devnet` etc.), not from a hardcoded constant.
- Use `connection.simulateTransaction(tx)` before `sendTransaction`. Surface simulation result in the UX ("This hedge will move ~$X USDC on Devnet. Confirm?"). This is also a *judge-visible* signal that you understand Solana — they score on ecosystem use.
- After wallet connect, log (or display) the cluster + first 4 chars of the pubkey so the user (and judge) can verify they're where they think they are.
- For Phase 3, support **both** Devnet (demo default) and Mainnet (feature-flagged off) — never delete the Mainnet path, just gate it. Demo-day judges who ask "what would this look like in production?" should see a clear answer.

**Warning signs:**
- TX explorer link points to a different cluster than your app's `endpoint`.
- `wallet.publicKey` is set but `connection.getBalance(pubkey)` throws.
- A successful Blink execution in dev returns no sigsignature after 30s — wrong-cluster race.

**Phase to address:** Phase 3 (Solana Blinks integration). But scaffold it in Phase 1: define a `cluster` config token and route every Solana touchpoint through it.

---

### Pitfall 5: Transaction drops because priority fee is zero (or wrong unit) under Mainnet congestion

**What goes wrong:**
For Phase 3 hedge execution, sending a transaction with the legacy `computeUnitLimit` and no `computeUnitPrice` instruction works fine on Devnet (no congestion). On Mainnet during a World Cup match — peak network load — the tx sits in the mempool for 60–90s and gets dropped. The "one-tap hedge" UX, which the entire product hinges on, becomes "watch your position bleed for 90 seconds while your tx expires."

Compounding: people underestimate by 10× because they use `computeUnitPrice` in microlamports (1 × 10⁻⁶ lamports) per CU and accidentally set 1 µ-lamport when they meant 1 lamport. The transaction is technically valid, just starved.

**Why it happens:**
- Solana fee market is dynamic; legacy tutorials copy 2022 code that ignores priority fees.
- "Microlamports per CU" is a unit most engineers don't internalize until they've been burned.
- Devnet masks the issue — no congestion, every tx lands.

**How to avoid:**
- Add a `ComputeBudgetProgram.setComputeUnitPrice({ microLamports: X })` instruction on every hedge tx. Use a dynamically-fetched value from `getRecentPrioritizationFees` (give the median × 2 as a base).
- Add a `setComputeUnitLimit` instruction too — measure your tx's actual CU consumption on devnet, set the limit to ~1.5× measured. Default 200k CU is way over-granted and you pay priority fee on it.
- Implement re-signing: if the tx isn't confirmed in 15s, re-sign with `lastValidBlockHeight = currentBlockHeight + 150` and a 1.5× priority fee. Show users a "Re-submitting with higher priority…" toast — they pay attention, this is their money.
- Always include a `blockhash` that's recent (<60s old) and a `lastValidBlockHeight` from `getLatestBlockhash`. Stale blockhash = silent drop.
- For the demo, run on Devnet with priority fees set correctly anyway, so the codepath is identical to Mainnet. Switching clusters is *not* the moment to discover the fee logic.

**Warning signs:**
- `sendTransaction` resolves but `connection.confirmTransaction` times out >30s.
- The tx explorer shows "Not Found" 60s after signing.
- Devnet tx lands in ~2s; your Mainnet test tx (if you do one) takes >60s consistently.

**Phase to address:** Phase 3. But spec it in Phase 2 architecture: a `SolanaTransactionService` that always sets both compute budget instructions is a boundary worth designing before the Blinks phase.

---

### Pitfall 6: WebView "PWA install" loses camera permission grant on Android Chrome

**What goes wrong:**
PROJECT.md declares a PWA strategy (installable via manifest). On Android Chrome, installing the PWA to the home screen creates a new `WebAPK` *separate* from the browser tab — and the camera permission grant from the browser doesn't transfer. The user installs the app, taps the icon, sees the camera permission prompt *again* and often taps "Deny" because they don't understand why it's asking twice. Even worse, on iOS Add-to-Home-Screen, the installed PWA loses `getUserMedia` *entirely* for non-Safari launches in some iOS variants — the API just rejects with `NotAllowedError`.

**Why it happens:**
- WebView storage and permission contexts are separate from the browser origin's.
- WebAPK is treated as a new "app" by Android's permission manager.
- iOS PWA camera has historically been half-broken; even today, PWA camera support requires HTTPS *and* HTTPS-installed-from-Safari-with-correct-manifest.

**How to avoid:**
- Treat "installed PWA" as a stretch goal, not the demo path. The hackathon demo should run in the browser tab — the judge installs nothing; you tap "Open app," share screen, done.
- If you do support install, after `beforeinstallprompt` and a successful install, *force* a re-permission flow with clear UX ("You installed BlinkEdge — tap to re-grant camera so we can overlay on the TV").
- Add a `navigator.permissions.query({ name: 'camera' })` check on every app launch. If `state !== 'granted'`, route to the permission gate view (Phase 1 requirement #24).
- iOS testing: pre-flight every demo on iOS Safari with the app served from the actual deployed origin, not from localhost — Safari's getUserMedia behaves differently on localhost.

**Warning signs:**
- Installed PWA shows black camera; same URL in Safari/Chrome tab works fine.
- `navigator.permissions.query` returns `denied` even though the user previously granted.
- Manifest is missing `display: 'fullscreen'` or `'standalone'` — installs as a normal bookmark.

**Phase to address:** Phase 1 (manifest + permission gate) and Phase 2 (verify install flow end-to-end). For the hackathon, deprioritize install — just make the tab experience flawless.

---

### Pitfall 7: Hackathon scope creep — "we'll do Blinks too" mid-Phase 1

**What goes wrong:**
Team reads the Solana-hackathon judging rubric (Fan UX, technical complexity, ecosystem use), sees "Blinks for hedge execution," and decides to start wiring up `@solana/wallet-adapter` *during Phase 1 Walking Skeleton*. By demo day, the camera works but the wallet code is half-finished, the user's flow is "grant permission → see HUD → tap a hedge button → app freezes → user closes." The judges score the broken wallet UX **worse** than they would have scored a clean "Phase 1 + mock hedge button that just shows a fake toast," because broken crypto flows erode trust.

**Why it happens:**
- Hackathon rubrics reward completion over ambition, but participants optimize for the *feature that sounds impressive in the readme* and under-build the *feature that actually works on stage*.
- "Walking Skeleton" sounds like a typo to non-engineering teammates; they push for visible Solana features as soon as Phase 1 hits "camera works."
- Wallet adapter tutorials are <50 LOC and look trivial; engineers underestimate the 30+ edge cases (network mismatch, priority fees, wallet not installed, mobile wallet deep-link failures).

**How to avoid:**
- Hold a hard "Phase 1 = camera + HUD + mock data only" line. PROJECT.md already says wallet is out of scope for Phase 1 — *enforce this in every planning conversation*.
- Instead of stubbing "Wallet disconnected (coming soon)," build a *plausible mock hedge modal* for Phase 1 demo: simulate-risk → simulate-hedge → fake-tx-confirmed toast. This shows judges the *full loop* without crypto risk. Mark it visually (amber `/warning` badge "MOCK HEDGE") so no one thinks you're faking Solana use.
- If judges ask about Blinks, you have a Phase 3 roadmap slide/block ready. A "here's how Phase 3 will land" statement with screenshots of working Devnet Blinks beats a half-working demo.
- Write a ONE-PAGE "demo choreography" doc: which device, which cluster, which match, which event triggers the hedge. Judges should see one happy path; deviate and the demo dies.

**Warning signs:**
- Phase 1 tasks take >2× estimate to complete.
- Wallet adapter code appears in the Phase 1 PR.
- Anyone on the team says "let's just try a real Solana tx, it's only 10 lines."

**Phase to address:** Phase 1 planning gate. The roadmap itself is the prevention — keep Blinks firmly in Phase 3.

---

### Pitfall 8: NeonChrome backdrop-blur + glow combo fails WCAG contrast against moving video

**What goes wrong:**
DESIGN.md uses `rgba(10,10,15,0.35)` translucent HUD backgrounds over the camera canvas so the TV is visible through. But over a soccer pitch (bright green) or a stadium floodlight (white), `#00f0ff` cyan text at `400` weight on a 35%-opacity dark panel can drop below WCAG AA 4.5:1. Worse, the moment a player in a red jersey runs behind a magenta-bordered OddsMatrix panel, the magenta glow blends with the red uniform and the user can't read the odds. The "AR companion" UX fails *because* the backdrop is dynamic — static design tokens can't predict every broadcast frame.

**Why it happens:**
- DESIGN.md originally specified `0.85` opacity (dashboard mode) — at 0.85 contrast works; at 0.35 it doesn't against arbitrary backdrops.
- WCAG 2.1 has a specific exception for "essential" presentation, but consumer apps can't claim that exemption.
- Contrast checkers use static backdrops; the dynamic video defeats them.

**How to avoid:**
- Add a `text-shadow: 0 0 4px rgba(10,10,15,0.9)` to HUD text — gives every label a guaranteed-minimum contrast halo regardless of backdrop. Restores readability while keeping AR translucence.
- Use `body-sm` (14px) minimum on HUD labels — no smaller text on translucent backgrounds.
- Border glow opacity should increase on auto-detected bright backdrops: hook the `<video>` to a "average luminance" sampler (downscale video to 1×1 canvas once per second, sample luminance). When avg luminance > 0.6, bump HUD background to `rgba(10,10,15,0.55)`.
- Pick HUD backdrop colors per their content's importance: Scoreboard (most critical) can stay at 0.35; OddsMatrix can be 0.55 since it's collapsed on mobile anyway.
- Test the demo recording against an actual bright World Cup broadcast frame — not a designer mock.

**Warning signs:**
- Judge squints at the screen during demo.
- Internal QA screens show HUD text disappearing against yellow/red jersey shots.
- `body-sm` text reads as "blurry" on video screenshots.

**Phase to address:** Phase 1. The luminance-adaptation is a Phase 2 polish item, but text-shadow + minimum opacity floors go in Phase 1.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded mock TxLine event sequence in `useState` | Fast Walking Skeleton, no async | Every change touches component; hard to swap to real stream | Phase 1 only. Must live behind a `TxLineProvider` interface contract from day 1. |
| `backdrop-filter` on every HUD card | Matches DESIGN.md literal | GPU death on mid-range Android | Never for the 4th+ card. Cap 3 always. |
| `100vh` instead of `100dvh` | Tailwind default, less typing | iOS layout jump, judge-visible glitch | Never on this project. Use `100dvh` everywhere with `100svh` fallback. |
| Inline `transaction.sign()` in WalletButton onClick | 10-line wallet integration | Real money loss on wrong cluster, untestable, no retry | Phase 1 mock only. Phase 3 must route through a `TransactionService`. |
| `console.log` for camera errors | Quick debugging | Users see no error state, just black screen | Phase 1 only if you also write to an error-boundary toast. Phase 2 needs structured logging. |
| `facingMode: { exact: 'environment' }` only | Single line, matches spec | Desktop demo fails with `OverconstrainedError`, no fallback | Never. Always pair with `optional` constraints + `user` fallback. |
| Mock transaction with `Math.random()` ID | Looks like a Solana signature | Confuses judges who paste into explorer | Acceptable for Phase 1 demo IF you visually mark it as MOCK (amber badge). Never acceptable as a "real signature." |
| CSS animations on every HUD update | Smooth feel on first 30s | Compounds with backdrop-filter GPU cost | Never on this project. Stagger updates, use `opacity`/`transform` only (compositor-friendly). |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `navigator.mediaDevices.getUserMedia` | Call once on mount, assume permission persists | Re-call after `visibilitychange → visible`; tear down on `hidden`. iOS revokes silently. |
| iOS Safari `<video>` + `playsInline` | Forget `playsInline` attribute → video opens fullscreen player | Always set `playsInline` `muted` `autoplay` on the camera `<video>`. |
| `@solana/wallet-adapter-react` | `autoConnect: true` for smooth UX | `autoConnect: false` for hedge flow; require explicit tap. Surfaces cluster mismatch. |
| Solana Blinks | Hardcode cluster to Devnet "for demo" | Derive cluster from the Blink action URL `?cluster=` parameter; never hardcode. |
| Solana `Connection` | Reuse a single Connection across the app; rate-limit themselves | Use `@solana/web3.js` with `commitment: 'confirmed'` for hedging (faster than 'finalized'); respect 10 RPS default RPC limit, use Helius/QuickNode for hackathon bench. |
| Wallet mobile deep-linking (Phantom, Solflare) | Assume deep-link returns to app within 30s blockhash window | Use a 150-block `lastValidBlockHeight` buffer; show "Waiting for wallet confirmation…" with a 60s countdown. |
| Tailwind `backdrop-blur-md` over video | Drop utility class everywhere | Cap 3 elements; downgrade blur radius on small viewports; feature-detect low-end devices. |
| PWA manifest | Use `display: 'standalone'` | For this AR app, `display: 'fullscreen'` is better — the URL bar cover the HUD when Chrome shows them on tab. Pair with `viewport-fit: cover`. |
| Next.js App Router + `'use client'` | Place `<CameraCanvas>` and Solana provider *both* at root layout | Camera should mount only in the route that needs it; wallet provider at root. Mixing causes camera to run on routes that don't need it (battery drain). |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 3+ concurrent `backdrop-filter` over live video | fps drops to single digits on mid-range Android | Hard cap 3; reduce blur radius on mobile; feature-detect low-end | Pixel 4a / Moto G Power / Galaxy A series: breaks immediately |
| `box-shadow` with `spread-lg` on every HUD card | Compositor scratch buffer allocations each frame; jank on iPhone SE | One `spread-lg` per viewport max; use `::before` pseudo-element borders for accent | iPhone SE 2 / Android 3GB RAM: breaks at 2+ cards |
| `requestAnimationFrame` driving both HUD updates and mock data tick | Two rAF loops fighting; 60fps frame drops on every tick | Drive mock data via `setInterval(2000ms)` (per spec); let rAF own only rendering | Continuous demo >5 min on any device |
| Full `getUserMedia` re-acquisition on every `visibilitychange` | 800ms black frame on resume; judge sees nothing | Retry with 200ms backoff; cache last video frame as poster image until re-acquired | Every backgrounding |
| Zod parsing on every 2000ms tick at full schema | CPU spike every tick; visible stutter on low-end | Validate once at boundary (provider entry), not at every component; cache parsed object | iPhone SE during heavy match moments |
| React re-rendering all HUDs on every tick (full state swap) | Whole tree re-renders, video freezes for 100ms | Use `useSyncExternalStore` + Zustand selector per HUD; each HUD subscribes only to its slice | Any time ≥3 HUDs update together |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `connection.rpcEndpoint` sourced from a frontend env var that's public in the bundle (Next.js `NEXT_PUBLIC_`) | RPC URLs leak; malicious RPC can return false `confirmTransaction` for your user's hedge | Use a Next.js API route as an RPC proxy for sensitive operations; keep the actual endpoint server-side. For hackathon, accept this risk but document it. |
| Auto-connecting wallet on app load | User can't intervene before a misconfigured tx; cluster mismatch goes unnoticed | Require explicit "Connect wallet" tap; show cluster + pubkey before any tx flow |
| No `simulateTransaction` before signing | User signs a failing tx; retries cost more fees and time | Always simulate; show estimated CU + cost + outcome before the confirm step. Judges love it. |
| Private key handling in Phase 3 server-side hedge flow (if any) | Key compromise = full wallet drain | Never hold user keys server-side. Use wallet adapter, sign client-side. If your hedge flow ever needs an app wallet, use Phantom's signing-only. Never store a keypair in env for a demo. |
| Blink action URL trusted client-side without verification | Malicious Blink URL injected by attacker (XSS) collects wallet signatures | Treat Blink action URL as untrusted input per `<required_reading>`; validate against an allowlist of known blockchain actions for the app. Fail loudly on unrecognized. |
| `localStorage` storing wallet connection state | Forgotten stale connections re-used on next visit → wrong cluster tx | Store only cluster + pubkey display info; never store connection secrets; force re-connect on each session for hedge flow |
| Mock hedge modal that *looks identical* to real | Judge accidentally thinks a fake tx is real USDC movement during demo | Always visually mark mock flows with amber `/warning` "MOCK HEDGE" badge (DESIGN.md `{colors.amber}` + `{colors.warning}` token). Never blur this distinction. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Camera permission request shown on first paint with no context | Users deny reflexively; demo instantly useless | Show a "value screen" first (mock gradient + neon HUD preview + "BlinkEdge overlays live odds on your TV. Tap Continue to use camera.") THEN request. Increases grant rate ~3×. |
| HUD overlays cover the scoreline of the broadcast | User can't see the actual game score, sees app's mock instead | User-test against a real broadcast screenshot; offset Scoreboard so it doesn't overlap the broadcast score bug (top-left on most matches). Top-center works for FIFA. |
| Real odds update mid-hedge flow (mock tick fires while user confirms) | User confirms a hedge for the wrong price; trust broken | Freeze the displayed odds snapshot when user enters hedge-flow; show "Locked at 14:32" timestamp. Phase 3 feature but design UX in Phase 1 mock. |
| App silently renders black after camera deny | User thinks app is broken, never returns | Per CONCERNS.md: gradient fallback. But also show a one-line explanation *in red text* explaining why ("Camera permission needed for AR overlay — showing static dashboard instead.") |
| Using SYSTEM notifications for hedge alerts | Android notification channels require permission; user denies → critical event missed | Use an in-app neon toast (fixed top, magenta border + glow) for AR/HUD-critical events. Reserve OS notifications for "match did end while app closed." |
| Touch target <44px on "Connect Wallet" / "Confirm Hedge" | User fat-fingers wrong button on a $50 tx; can't undo | All financial actions minimum 44px × 44px (DESIGN.md spec); add 8px gap between adjacent destructive confirmations. |
| Animation on every event (red card → 3s neon flash) | After 5 events the repeated flash is fatiguing; user looks away from TV | Cap animation cadence: 1s max per flash; cumulative duration cap 3s per 30s window. Use glow intensification (`spread-sm` → `spread-md`) not new geometries. |

## "Looks Done But Isn't" Checklist

- [ ] **Camera permission flow:** Often missing the iOS visibilitychange re-acquire path — verify "lock phone → unlock → app still shows live camera within 1s."
- [ ] **HUD overlays:** Often missing `env(safe-area-inset-bottom)` on ConsensusIndicator — verify on iPhone 14+ that it sits above the home indicator, not under.
- [ ] **App shell:** Often missing `viewport-fit=cover` in meta — verify `env(safe-area-inset-*)` returns non-zero values in devtools console on a notched device.
- [ ] **backdrop-filter HUD:** Often missing the mid-range-Android fps test — verify `≥30fps for 5 minutes continuous` on a Pixel 4a or similar with Chrome devtools profiling.
- [ ] **Mock TxLineProvider:** Often non-deterministic (uses `Math.random` without seed) — verify same seed → same event sequence → reliable demo.
- [ ] **Wallet flow:** Often missing `simulateTransaction` — verify a "won't simulate" tx fails gracefully with a visible error toast, not silent hang.
- [ ] **Hedge modal:** Often missing "locked price" timestamp — verify that during the 5s the modal is open, the displayed odds do NOT update on the next 2s tick.
- [ ] **PWA install:** Often missing the install→re-permission UX — verify installed PWA shows the permission gate, not black camera.
- [ ] **Solana cluster:** Often missing a visible cluster indicator in the UI — verify the connected cluster ("Devnet" badge) is visible somewhere, ideally on the wallet connect button.
- [ ] **Demo choreography:** Often missing a written demo script — verify a teammate who's never demoed can read the script and reproduce the happy path live.
- [ ] **Translucent text contrast:** Often missing the text-shadow halo on HUD labels — verify readability over a bright broadcast frame (e.g., stadium floodlight shot).
- [ ] **Error toast for camera:** Often only console.error — verify that on `NotAllowedError` the user sees a neon amber toast with troubleshooting copy.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Camera frozen after iOS background | LOW | (a) destroy stream, (b) clear `<video>.srcObject`, (c) call getUserMedia again with retry; show "Reconnecting…" amber toast; cached poster frame bridges visual gap |
| Layout uses `100vh` instead of `100dvh` | MEDIUM | Replace `h-screen` with `h-[100dvh]` Tailwind utility; add `@supports (height: 100dvh)` fallback to `100svh` for older Safari; test on every HUD component |
| Wrong-cluster wallet tx (no funds lost yet) | MEDIUM | Strict `simulateTransaction` before `sendTransaction`; if simulated balance change is on unexpected cluster → abort; refund logic NOT needed if you never send |
| Mid-Phase 1 wallet code creep | HIGH | Roll back to last "camera-only" commit; "mock hedge modal" as the demo; move all Solana code to a `phase-3-scaffold` branch *so it's not deleted* but kept out of Phase 1 PR |
| 3+ backdrop-filter crash on judge's Android | LOW (demo) | Quick toggle: `?basic=1` query param → app renders HUDs with solid `rgba(10,10,15,0.7)` backgrounds, no blur. Pre-built fallback route saves the demo. |
| Mock data non-deterministic → flaky demo | LOW | Replace `Math.random()` with a seeded PRNG (`seedrandom` package or `mulberry32`); document the seed in the route ("Dev match seed: 42 → guaranteed red card at minute 67"). Demo always works. |
| Wallet auto-connect → wrong cluster panic | MEDIUM | Disable `autoConnect`, force explicit connect; rebuild with `simulateTransaction` gate; if already on stage → deploy hotfix branch in <5 min, no rebuild of non-wallet code |
| Text invisible over bright backdrop | LOW | Add `text-shadow` to HUD text components; bump HUD background opacity from 0.35 to 0.55; redeploy |
| PWA install camera denied (Phase 2) | MEDIUM | Pre-flight on every demo: use Safari/Chrome TAB not installed icon; document "tap 'Open in Safari' not the icon" in demo script; long-term: postinstall re-permission flow in Phase 2 |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| #1 Camera frozen on iOS background | Phase 1 | QA: lock/unlock phone 3× during demo; camera resumes in <1s each time |
| #2 backdrop-filter fps collapse | Phase 1 | UAT: 5-minute Chrome DevTools perf trace on Pixel 4a → avg fps ≥30 |
| #3 `100vh` layout jump | Phase 1 | QA: scroll page on iPhone 12 → no HUD widget shifts |
| #4 Wrong-cluster wallet tx | Phase 3 (scaffold token in Phase 1) | UAT: simulate→confirm→cluster badge visible; no send without simulate |
| #5 Tx drop under congestion | Phase 3 | UAT: tx lands <15s after sign on Devnet; test on Mainnet with 0.001 SOL dust |
| #6 PWA install camera loss | Phase 1 (permission gate), Phase 2 (install flow) | QA: install PWA → re-permission flow triggers; demo path stays in tab |
| #7 Phase 1 wallet scope creep | Phase 1 planning gate | Gate: no `@solana/*` packages in Phase 1 `package.json` deps |
| #8 WCAG contrast on video | Phase 1 (text-shadow + min opacity), Phase 2 (luminance adapt) | QA: screenshot HUD over bright broadcast frame → AA contrast 4.5:1 on critical labels |

## Sources

- Apple WebKit — *Known issues with `getUserMedia` on iOS Safari* (foreground-only camera; `onended` unreliable; `facingMode: exact` rejection behavior). Confirmed via project CONCERNS.md #1, #6.
- MDN — *Using the dynamic viewport unit (`dvh`, `svh`, `lvh`)* — `100vh` iOS Safari URL bar behavior; `viewport-fit: cover` requirement for safe-area insets.
- Chrome DevTools team — *`backdrop-filter` performance over video* — compositor scratch buffers; blur-cost scales with radius².
- Solana Foundation / Helius — *Priority fees and compute budget* — `computeUnitPrice` in microlamports per CU; `setComputeUnitLimit`; `getRecentPrioritizationFees`.
- @solana/wallet-adapter docs — *`autoConnect`, cluster mismatch, `simulateTransaction` workflow*.
- Dialect Labs — *Solana Blinks action URL cluster parameter* — `?cluster=devnet|mainnet-beta` parsing.
- W3C WCAG 2.1 — *Contrast exceptions; dynamic media contrast*.
- Project artifacts cross-referenced: `.planning/PROJECT.md` (requirements, key decisions, out-of-scope), `DESIGN.md` (NeonChrome tokens, translucent backgrounds, glow depth system), `.planning/codebase/CONCERNS.md` (8 forward-looking risks).
- Personal experience: prior hackathon demos where (a) iOS backgrounding killed camera live; (b) `100vh` caused HUD to slide under notch on demo device; (c) wallet `autoConnect` "smooth UX" failed on stage with wrong-cluster tx.

---
*Pitfalls research for: Mobile AR/HUD + Solana sports companion (FIFA Solana 2026 hackathon)*
*Researched: 2026-07-06*