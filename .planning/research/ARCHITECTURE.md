# Architecture Research

**Domain:** Mobile AR/HUD sports companion app + Solana Blinks hedge execution
**Researched:** 2026-07-06
**Confidence:** HIGH (core flow) · MEDIUM (risk engine internals, transport choice)
**Scope:** Full architecture vision (Phase 1 Walking Skeleton, Phase 2 live TxLINE, Phase 3 TxEdge AI Agent + Solana Blinks). Informs roadmap phase structure.

---

## Standard Architecture

BlinkEdge is a **mobile-first PWA with a layered camera-as-canvas AR overlay**. There is no server-rendered dashboard page — every screen is a single fixed full-viewport canvas with a live `<video>` camera feed as the bottom layer and translucent neon HUD widgets floating above it. Real-time sports data flows in from a TxLINE stream, a risk engine watches the stream for critical events, and a Solana Blink execution surface lets the user hedge a position with one tap.

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLIENT (Mobile PWA, Next.js App Router)           │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │                  App Shell (fixed inset-0, 100dvh)                │ │
│ │  ┌───────────────────────── LAYER STACK (z-order) ─────────────┐ │ │
│ │  │ z0: <video> CameraBackdrop         (getUserMedia rear cam)  │ │ │
│ │  │ z10: GradientFallback             (deny / error substitute)  │ │ │
│ │  │ z20: HUD Widgets (absolute positioned)                       │ │ │
│ │  │      Scoreboard | OddsMatrix | ConsensusIndicator            │ │ │
│ │  │ z30: RiskAlertSheet (overlay, Phase 3 — spring on event)     │ │ │
│ │  │ z40: BlinkHedgeCard (overlay, Phase 3 — sign/exec)          │ │ │
│ │  │ z50: CameraPermissionGate / WalletFlow modal (occlusive)     │ │ │
│ │  └──────────────────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│ ┌─────────── Providers (React Context, mounted at root) ───────────┐ │
│ │   TxLineProvider        WalletProvider        RiskEngineProvider  │ │
│ │   (stream + tick state) (Solana wallet)      (event risk state) │ │
│ └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
            │                                    │
            │ TxLINE event stream                │ Hedge tx (sign + send)
            ▼                                    ▼
┌────────────────────────────┐         ┌──────────────────────────────┐
│   TxLINE Source (Phase 1:   │         │   Solana Actions endpoint     │
│   in-memory mock, 2s tick;  │         │   (GET metadata, POST {account})│
│   Phase 2: live SSE)        │         │   returns base64 tx, sign via  │
└────────────────────────────┘         │   Mobile Wallet Adapter → RPC  │
                                       └──────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                RISK ENGINE (Phase 3 — pure client)                  │
│  TxLineProvider event ──► RiskEngine.evaluate(packet)               │
│                              │                                       │
│  Ruleset (declarative):      ├──► RiskAssessment {severity, reason,│
│  - red card                 │     recommendedAction, expiresAt}    │
│  - injury (star player)     │                                       │
│  - odds swing > threshold   ▼                                       │
│  - score collapse (lead     onRiskAlert(attemptHedgeAction)         │
│     reversal)                 ──► renders risk overlay + Blink card│
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **App Shell** (`app/page.tsx`) | Owns the fixed 100dvh canvas, lays out HUD z-stack, mounts providers | Next.js App Router client component, `fixed inset-0 overflow-hidden bg-canvas` |
| **CameraBackdrop** | Acquire rear camera stream, paint full-viewport `<video>` | `navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}, audio:false})`, `object-fit: cover`, autoplay+playsinline+muted |
| **GradientFallback** | Substitute when camera denied/unavailable | CSS radial gradient on canvas color, mounted conditionally |
| **HUD Widget** (`Scoreboard`/`OddsMatrix`/`ConsensusIndicator`) | Render one neon card over the camera; subscribe to TxLineProvider | Absolute-positioned `card-neon-*` with `backdrop-blur(16px)`, `will-change: backdrop-filter`, `contain: layout paint` |
| **CameraPermissionGate** | Onboarding overlay; show rationale button before `getUserMedia` | `navigator.permissions.query({name:'camera'})`, 44px touch target, dismisses on grant |
| **TxLineProvider** | Hold latest `TxLineEventPacket`, emit on tick, validate via Zod | React context, `useEffect` interval (Phase 1 mock 2000ms) or `EventSource` (Phase 2 SSE) |
| **TxLineEventPacket (Zod schema)** | Boundary schema for stream → consumer | `z.object({matchId, timestamp, minute, score, possession, events[], oddsSnapshot, consensus})` |
| **RiskEngine** (Phase 3) | Evaluate event packet against ruleset → emit RiskAssessment | Pure reducer over packet diff; subscribes to TxLineProvider |
| **RiskAlertSheet** (Phase 3) | Surface the assessment to the user with reason + CTA | Bottom sheet overlay (card-neon-magenta for severity), spring-in animation |
| **BlinkHedgeCard** (Phase 3) | Render the solana-action preview, hand off to wallet on tap | Fetch Action GET → render `label`/`description` → on POST → decode tx → wallet adapter `signAndSendTransaction` |
| **WalletProvider** (Phase 3) | Solana wallet adapter for PWA deep-link signing | `@solana/wallet-adapter-react` + Phantom/Solflare, Mobile Wallet Adapter v2.2.9 |
| **Solana Action endpoint** (Phase 3) | GET/POST handler returning base64 signable hedge transaction | Next.js Route Handler at `/api/actions/hedge/{marketId}` + `actions.json` at domain root |
| **MatchSelector** (Phase 2) | Pick which match TxLINE streams for the broadcast in view | Manual dropdown MVP, optional broadcast recognition later |

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout, viewport meta (100dvh, viewport-fit=cover)
│   ├── page.tsx                   # Main canvas (fixed inset-0, mounts providers + shell)
│   ├── manifest.ts                # PWA manifest (standalone, portrait, BlinkEdge theme)
│   ├── icon.tsx / apple-icon.tsx  # PWA icons
│   ├── actions.json/route.ts      # Solana Actions mapping (Phase 3)
│   └── api/
│       └── actions/
│           └── hedge/
│               └── [marketId]/
│                   └── route.ts    # Action GET/POST handlers (Phase 3)
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx           # Fixed canvas + z-stack orchestrator
│   │   └── GradientFallback.tsx
│   ├── camera/
│   │   ├── CameraBackdrop.tsx     # <video> getUserMedia rear cam
│   │   └── CameraPermissionGate.tsx
│   ├── hud/
│   │   ├── Scoreboard.tsx         # Top-center, card-neon cyan
│   │   ├── OddsMatrix.tsx         # Right-edge, card-neon magenta (collapsed mobile)
│   │   └── ConsensusIndicator.tsx # Bottom-center, card-neon acid green
│   ├── risk/                       # Phase 3
│   │   ├── RiskAlertSheet.tsx     # Bottom-sheet severity overlay
│   │   └── BlinkHedgeCard.tsx     # Action preview + sign CTA
│   └── ui/                         # NeonChrome primitives (NeonCard, NeonButton, NeonBadge)
├── lib/
│   ├── txline/
│   │   ├── TxLineProvider.tsx     # React context: stream + state
│   │   ├── mockSource.ts          # Deterministic in-memory tick (Phase 1)
│   │   ├── liveSource.ts          # EventSource wrapper (Phase 2 SSE)
│   │   └── types.ts               # TS types derived from Zod
│   ├── schema/
│   │   └── txLineSchema.ts        # Zod: TxLineEventPacket (+ sub-schemas)
│   ├── risk/                       # Phase 3
│   │   ├── riskEngine.ts          # evaluate(packet) → RiskAssessment
│   │   ├── rules.ts               # Declarative ruleset (red card, injury, odds swing...)
│   │   └── types.ts               # RiskAssessment, RiskRule
│   ├── blink/                      # Phase 3
│   │   ├── actionClient.ts        # GET metadata, POST {account}, decode tx
│   │   ├── wallet.ts              # Wallet adapter wiring (MWA deep-link)
│   │   └── chain.ts               # RPC connection + recentBlockhash set
│   └── perf/
│       └── blurBudget.ts          # guard: max 3 concurrent backdrop-blur
└── tailwind.config.ts              # NeonChrome tokens → Tailwind theme
```

### Structure Rationale

- **`app/api/actions/`**: Solana Actions spec requires an HTTPS endpoint and an `actions.json` at domain root. Keeping them under App Router's Route Handler convention produces the correct URLs (`/api/actions/hedge/[marketId]`) and lets `actions.json` map site paths to them.
- **`lib/txline/` split into source variants**: Phase 1 ships `mockSource` with a deterministic 2s tick; Phase 2 swaps in `liveSource` (EventSource) behind the same `TxLineProvider` contract so consumers (HUD, RiskEngine) never change. This is the seam that lets Phase 1 stay Walking Skeleton.
- **`lib/risk/` pure functions + declarative rules**: The risk engine is the hackathon's technical complexity score lever. Keeping `rules.ts` declarative means new risk signals (red card, odds swing) become data edits, not code branches.
- **`lib/perf/blurBudget.ts` as a real module**: The 3-concurrent-backdrop-blur cap is a hard GPU constraint on mid-range mobile. Centralizing the gate prevents accidental regression when a new widget is added.
- **`components/ui/` NeonChrome primitives**: The design system forbids drop shadows and many-token combinations. Primitives enforce those rules at the component level instead of relying on every contributor to read DESIGN.md.

## Architectural Patterns

### Pattern 1: Camera-as-Canvas Layer Stack (z-ordered siblings, NOT nested)

**What:** The `<video>` and every HUD widget are **direct children of the fixed app shell** — never wrapped in a translucent container. Each overlay layer uses `position: absolute` + `inset-*` and its own `backdrop-filter`.
**When to use:** Anywhere `backdrop-filter` must sample content painted *behind* the overlay.
**Trade-offs:** Slightly more verbose than nested flex layout; gives correct blur sampling and independent compositor layers per HUD (better GPU scheduling).

**Why this matters (from source digest, HIGH confidence):** `backdrop-filter` only blurs content up to the nearest *backdrop root*. Any ancestor with `opacity<1`, `filter`, `mask`, `will-change: backdrop-filter`, or `transform` becomes a backdrop root — so a translucent scrim wrapper around the HUDs would make the HUD `backdrop-filter` blur *itself* instead of the camera feed. The TV broadcast must remain visible through the widgets; this rule is non-negotiable.

```tsx
// ✅ Correct: HUDs are siblings of <video>, both children of opaque fixed shell
<main className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-canvas">
  <CameraBackdrop />                                  {/* z0, opaque */}
  <Scoreboard className="absolute top-0 inset-x-0 z-20" />
  <OddsMatrix className="absolute right-0 top-1/2 z-20" />
  <ConsensusIndicator className="absolute bottom-0 inset-x-0 z-20" />
</main>

// ❌ Wrong: translucent scrim wrapper breaks backdrop-filter sampling
<main className="fixed inset-0">
  <div className="bg-canvas/35">                       {/* ancestor with opacity<1 → backdrop root */}
    <CameraBackdrop />
    <Scoreboard />                                     {/* now blurs the scrim, not the camera */}
  </div>
</main>
```

HUD widgets themselves use translucent backgrounds (`rgba(10,10,15,0.35)`) — opaque backgrounds (the `0.85` in DESIGN.md's `nav-bar`) would defeat the AR effect and hide the TV broadcast.

### Pattern 2: Anticipatory Provider Seam (mock behind real interface)

**What:** A React context exposes a stream contract (subscribe, latest packet, last tick at) and the *source* behind it is swappable. Phase 1 ships a deterministic in-memory tick; Phase 2 swaps in a live `EventSource` without touching consumers.
**When to use:** When a real data source will be introduced later but the UI needs to be demoable now.
**Trade-offs:** Slight upfront cost defining the interface; pays for itself the moment Phase 2 begins.

```tsx
// lib/txline/TxLineProvider.tsx — contract stable across phases
interface TxLineSource {
  subscribe(cb: (packet: TxLineEventPacket) => void): () => void;
  latest(): TxLineEventPacket | null;
}

// Phase 1
const mock: TxLineSource = createMockSource({ tickMs: 2000, fixture });

// Phase 2 — drop-in replacement
const live: TxLineSource = createEventSourceSource({
  url: '/api/txline/stream',
  // EventSource auto-reconnects; we normalize backoff + last-event-id
});

export function TxLineProvider({ source = mock, children }) { /* ... */ }
```

### Pattern 3: Pure-Function Risk Engine over Event Diff

**What:** The risk engine is a pure reducer: `(prevPacket, curPacket) → RiskAssessment[]`. It subscribes to TxLineProvider, diffs the event arrays, and emits assessments. No React state, no side effects inside `evaluate()`.
**When to use:** When the hard part is "decide when to alert" — testing rules independently of the UI is essential for hackathon judge trust.
**Trade-offs:** Strict purity adds boilerplate; enables unit testing of "red card at minute 67 → severity HIGH" without rendering a single component.

```tsx
// lib/risk/riskEngine.ts
export function evaluate(
  prev: TxLineEventPacket | null,
  cur: TxLineEventPacket,
  now: number,
): RiskAssessment[] {
  const newEvents = prev ? diffEvents(prev.events, cur.events) : [];
  return RULES.flatMap(rule => rule.fire(newEvents, cur, now))
              .filter(Boolean) as RiskAssessment[];
}

// lib/risk/rules.ts — declarative, data-driven
export const RULES: RiskRule[] = [
  {
    id: 'red-card',
    matches: e => e.type === 'card' && e.cardColor === 'red',
    severity: 'HIGH',
    reason: e => `Red card on ${e.playerName} — position deteriorating`,
    recommendedAction: 'hedge_goal_line', // resolves to a Solana Action URL
    ttlMs: 30_000,
  },
  {
    id: 'odds-swing',
    matches: (e, cur, prev) => oddsDeltaPct(cur.oddsSnapshot, prev.oddsSnapshot) > 0.18,
    severity: 'MEDIUM',
    reason: () => 'Odds moved >18% since last tick — momentum shift',
    recommendedAction: 'hedge_next_goal',
    ttlMs: 20_000,
  },
  // ...injury, lead reversal, possession cliff
];
```

### Pattern 4: One-Tap Blink Execution (Action → Wallet → RPC)

**What:** The risk alert surfaces a solana-action URL. `BlinkHedgeCard` GETs the Action metadata, renders label/description, and on tap POSTs `{account: walletPubkey}` to receive a base64 transaction. The client decodes, sets `feePayer`+`recentBlockhash` if unsigned, signs via Mobile Wallet Adapter, and sends to RPC.
**When to use:** Anywhere you want "execute a transaction without leaving the AR overlay."
**Trade-offs:** Action endpoints must be CORS-enabled (`Access-Control-Allow-Origin: *`) and host `actions.json` at the domain root — a small deploy-time checklist.

```tsx
// lib/blink/actionClient.ts
export async function loadAction(actionUrl: string): Promise<ActionGetResponse> {
  const res = await fetch(actionUrl, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Action GET ${res.status}`);
  return res.json();
}

export async function postAction(actionUrl: string, account: string): Promise<ActionPostResponse> {
  const res = await fetch(actionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account }),
  });
  return res.json(); // { transaction: base64, message?, links.next? }
}

// In BlinkHedgeCard "Hedge now" handler:
const { transaction: b64tx, message } = await postAction(actionHref, wallet.publicKey.toBase58());
const tx = Transaction.from(Buffer.from(b64tx, 'base64'));
if (!tx.signatures.length) {
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
}
const sig = await wallet.signAndSendTransaction(tx); // deep-link to Phantom/Solflare
// use `links.next` (PostNextActionLink same-origin callback) to confirm + show "Hedged ✓"
```

### Pattern 5: GPU-Scoped Blur Budget Guard

**What:** A runtime guard tracks concurrent `backdrop-filter` mounts and refuses a 4th. The HUD widgets request a blur slot on mount and release on unmount.
**When to use:** Mid-range mobile (Pixel 4a / iPhone SE 2nd gen) cannot sustain 3+ simultaneous blur layers over live video without dropping below 30fps.
**Trade-offs:** One widget may be denied blur — must degrade gracefully (fall back to translucent bg without blur).

## Data Flow

### End-to-End Request Flow

```
[Match selected] −Phase 2→ [TxLINE stream attaches]
        │
        ▼
TxLineProvider ──(2s tick mock / SSE live)──► TxLineEventPacket (Zod-validated)
        │
        ├──► HUD Widgets           (subscribe, re-render latest snapshot)
        │       ↓
        │   backdrop-blur(16px) over <video> (rear camera, environment)
        │       ↓
        │   User sees neon widgets floating over TV broadcast ←── Objective: Fan UX
        │
        └──► RiskEngine           (Phase 3, diffs events, emits RiskAssessment[])
                │
                ▼ (onRiskAlert)
            RiskAlertSheet         (severity card, reason, "Hedge now" CTA)
                │ user taps
                ▼
            BlinkHedgeCard
                │ 1. GET solana-action URL → metadata
                │ 2. POST {account: wallet.pubkey} → base64 tx
                │ 3. decode → set feePayer + recentBlockhash
                │ 4. wallet.signAndSendTransaction (deep-link → Phantom/Solflare)
                │ 5. RPC confirms → links.next callback → "Hedged ✓"
                ▼
            Wallet + RPC           (onchain hedge position)
```

### State Management

```
TxLineProvider (single source of truth for live match state)
        │
        ├── (subscribe) ─► HUD components   (read-only; re-render on tick)
        └── (subscribe) ─► RiskEngineProvider
                                │
                                ├─ assesses state diff
                                ├─ holds Queue<RiskAssessment> (active alerts)
                                └─ (subscribe) ─► RiskAlertSheet / BlinkHedgeCard

WalletProvider (independent; user-controlled connection)
        │
        └── (subscribe) ─► BlinkHedgeCard (signs when user taps "Hedge")
```

**Boundary rule:** HUD widgets are read-only consumers of `TxLineProvider`. Wallet interaction is isolated to the `BlinkHedgeCard` so the camera/HUD pipeline is never blocked on wallet state.

### Key Data Flows

1. **Live-state flow:** TxLINE → Zod schema → React context → HUD render. Validated at the boundary by Zod so a malformed packet never corrupts UI state.
2. **Risk-event flow:** TxLineProvider → RiskEngine (`evaluate(prev,cur,now)`) → RiskAssessment queue → RiskAlertSheet. RiskEngine holds no React state itself; the Provider memoizes the latest assessments.
3. **Hedge-execution flow:** RiskAssessment → Action URL → GET → POST → tx → wallet deep-link → RPC → confirm via `links.next` (Phase 3).
4. **Permission/cache flow:** `navigator.permissions.query({name:'camera'})` → CameraPermissionGate visibility; `localStorage` memoizes last-known permission and the most recently selected matchId.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Hackathon demo (1-10 concurrent users) | Phase 1 monolith PWA is correct. In-memory mock is fine. One Next.js process serves the static PWA. No DB. |
| Soft launch (100-1k concurrent streams) | Phase 2: replace mock source with SSE-backed EventSource from a real TxLINE relay; introduce Next.js Route Handler `/api/txline/stream` that fans out one upstream subscription to many SSE clients. Zod-validated packets at fan-out point. |
| Production (10k+ concurrent) | Phase 3+: run the Action endpoint behind a load balancer; cache recent blockhash per request; rate-limit POST per `{account, marketId}` to prevent Blink abuse; (future) move RiskEngine into a service worker to persist across tab backgrounding. |

### Scaling Priorities

1. **First bottleneck: Action endpoint serialization.** Each hedge POST builds a Solana transaction synchronously; under load, switch to a pre-built tx template + per-request `getLatestBlockhash` lookup (cheap, cached 1s).
2. **Second bottleneck: SSE fan-out.** A single Next.js process holding N SSE connections is RAM-bound (each open socket ~80-150KB). Move the relay behind a dedicated service (or run on edge) before 1k concurrent watchers.
3. **Third bottleneck: mobile GPU.** Not user-count scalability — *per-device*. The blur-budget guard is the control. If a 4th blur is requested, fall back to translucent bg only (no blur) and warn in dev console.

## Anti-Patterns

### Anti-Pattern 1: Translucent wrapper around the HUD stack

**What people do:** Wrap `<video>` and HUDs in a single `bg-canvas/35` scrim to "lock the dark look."
**Why it's wrong:** The scrim is an ancestor with `opacity<1`, which makes it a CSS backdrop root. Every HUD's `backdrop-filter` then blurs the scrim, not the camera — destroying the AR effect and the TV-visibility requirement.
**Do this instead:** Make the app shell opaque (`bg-canvas`) and each HUD individually translucent (`background: rgba(10,10,15,0.35)` + `backdrop-blur(16px)`). Widgets are siblings of the `<video>`, not its sibling's children.

### Anti-Pattern 2: Polling the wallet for connection state

**What people do:** `setInterval`-poll `wallet.connected` to decide when to render the Hedge CTA.
**Why it's wrong:** The wallet adapter exposes a reactive subscription; polling wastes battery on mobile and races with deep-link completion.
**Do this instead:** Subscribe to `wallet.adapter.connection$` once at the provider; expose a `useWallet()` hook. The CTA is rendered only while the alert is active AND the wallet is ready — single subscription.

### Anti-Pattern 3: Embedding raw business logic inside React components

**What people do:** Write the red-card / odds-swing logic inline in `RiskAlertSheet.tsx`.
**Why it's wrong:** Untestable. The "technical complexity" hackathon-judge lever is the risk engine — hiding it inside a component means no unit tests, no clear story to demo.
**Do this instead:** Put `evaluate()` and `RULES` in `lib/risk/` as pure functions/data. Unit test each rule against fixture packets. The component only renders whatever the engine emits.

### Anti-Pattern 4: Pure #000000 backgrounds / drop shadows for "depth"

**What people do:** Pick pure black and add `box-shadow: 0 4px 8px rgba(0,0,0,0.5)` because "that's how UI depth works."
**Why it's wrong:** Explicitly forbidden by NeonChrome (DESIGN.md). Pure #000 reads as dead; the chrome undertone in `#0a0a0f` is the system identity. Drop shadows read as flat against a dark canvas, and they shave frame budget when combined with `backdrop-filter`.
**Do this instead:** Depth = glow intensity. Use `glow.spread-sm/md/lg` compound `box-shadow` (no offset, only `0 0 Npx` color bleeds). Hierarchy comes from glow tier, not shadow size.

### Anti-Pattern 5: 4+ simultaneous `backdrop-filter` overlays

**What people do:** "We have 5 widgets" → mount 5 blurred panels at once.
**Why it's wrong:** `backdrop-filter` is GPU-bound. On Pixel 4a / iPhone SE, each live-video blurred overlay can cost 8-12fps. 4 concurrent drops you below 30fps → visibly janky AR.
**Do this instead:** Blur-budget guard caps at 3. The 4th widget renders translucent-without-blur (still readable, just less atmospheric). `will-change: backdrop-filter` + `contain: layout paint` on every blurred element.

### Anti-Pattern 6: Building the Solana Action without `actions.json` / CORS headers

**What people do:** Implement `/api/actions/hedge` only, deploy, find Blink clients (Dialect, dial.to) silently refuse to unfurl it.
**Why it's wrong:** The spec requires `actions.json` at domain root mapping path patterns and `Access-Control-Allow-Origin: *` on both `/actions.json` and the Action endpoint.
**Do this instead:** Ship `app/actions.json/route.ts` from day one of Phase 3 returning `{rules:[{pathPattern:'/hedge/*', apiPath:'/api/actions/hedge/*'}]}` with `*` CORS. Validate with the [Blinks Inspector](https://www.blinks.xyz/inspector) before demo.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **TxLINE stream** (Phase 2) | `EventSource` over SSE; auto-reconnect; resume from `Last-Event-ID` | Phase 1: ignore; `mockSource` produces deterministic ticks. Normalize to a single `TxLineSource` contract so swap-in is one line. |
| **Solana Action endpoint** (own server, Phase 3) | Route Handler `/api/actions/hedge/[marketId]` returning `ActionGetResponse`/`ActionPostResponse`; base64 tx via `@solana/actions` | Must serve `actions.json` at domain root with `*` CORS; OPTIONS handler for preflight; Dialect registry only gates social-feed unfurling — in-app blink rendering works without it. |
| **Mobile Wallet Adapter v2.2.9** (June 2026) (Phase 3) | `@solana/wallet-adapter-react`; PWA deep-link signing via Phantom/Solflare | Confirms feasibility of PWA-native hedging without a native app wrapper — `signAndSendTransaction` deep-links to the installed wallet and returns the signature. |
| **Solana RPC** (Phase 3) | `@solana/web3.js` `Connection` for `getLatestBlockhash`, `sendRawTransaction`, confirmation | Use a public devnet endpoint for hackathon demo; mainnet-beta only for real fund movement. |
| **`navigator.permissions` / `getUserMedia`** (Phase 1) | `permissions.query({name:'camera'})` → gate; `getUserMedia({video:{facingMode:{ideal:'environment'}}, audio:false})` | **HTTPS mandatory** (localhost is also a secure context); iOS requires user-gesture-initiated call — put it behind the gate button. Use `ideal` not `exact` so devices with only one camera don't reject. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| TxLineSource ↔ TxLineProvider | Subscribe callback `cb(packet)` returning unsubscribe fn | Provider owns React state; Sources are framework-agnostic. Swappable Phase 1 → 2. |
| TxLineProvider ↔ HUD widgets | React context + `useContext` re-render | Widgets read-only; no writes back. Zod-validated at the source, so widget props are typed. |
| TxLineProvider ↔ RiskEngine | RiskEngine subscribes via `useEffect` and diffs packets | Engine emits `RiskAssessment[]` into RiskEngineProvider state; never touches HUD stream. |
| RiskEngineProvider ↔ RiskAlertSheet | Provider → Reader context | Sheet renders from the active assessments queue; tapping CTA triggers Blink flow. |
| BlinkHedgeCard ↔ WalletProvider | `useWallet()` hook → `signAndSendTransaction` | Wallet only invoked on explicit user tap. Never auto-signs. No background signing. |
| BlinkHedgeCard ↔ Solana Action endpoint | `fetch` GET + POST to action URL | Same-origin since Action handler is hosted on the PWA itself (`/api/actions/hedge/...`). External TxLINE / Dialect registry never holds secrets. |
| Any client ↔ Solana RPC | `@solana/web3.js` `Connection` | All tx signing happens client-side via wallet adapter before sendRawTransaction. |

## Implications for Roadmap (build order)

Research suggests a **dependency-ordered** build sequence where each phase unlocks the next seam. Phase numbers align with the project doc's Phase 1 / 2 / 3 split.

### Ordered Build Sequence

1. **Phase 1 — Walking Skeleton (camera + mock HUD render loop)**
   Establishes the layer stack (Pattern 1), the TxLineProvider seam (Pattern 2 with mock source), the Zod boundary schema, and the 3 HUD widgets with the blur-budget guard (Pattern 5).
   **Unlocks:** All downstream phases inherit the canvas + provider; nothing should change about the HUD wiring.

2. **Phase 2 — Live TxLINE integration**
   Behind the existing `TxLineProvider` contract, swap `mockSource` for `createEventSourceSource`. Add match selection. Add PWA service worker for offline shell.
   **Why second:** Replacing the source is a one-line change at the Provider; if Phase 1's seam is correct, Phase 2 is mostly network plumbing.
   **Risk flag:** Likely needs deeper research on TxLINE's actual wire protocol (event format, Last-Event-ID resumption, rate limits) — defer to Phase 2 discuss.

3. **Phase 3a — Risk Engine (pure reducer + ruleset)**
   Pattern 3: `lib/risk/` as pure functions over `TxLineEventPacket` diffs. Build the declarative ruleset (red card, injury, odds swing, lead reversal). Emit `RiskAssessment[]`. Render `RiskAlertSheet`.
   **Why before Blinks:** A demo-able risk engine with no wallet still scores "technical complexity" on rubric. Blinks without a risk trigger is just "a button that signs a tx."

4. **Phase 3b — Solana Action endpoint + BlinkHedgeCard**
   Ship `app/api/actions/hedge/[marketId]/route.ts` + `app/actions.json/route.ts` (Action GET/POST + spec compliance). Then build `BlinkHedgeCard` using Pattern 4 (load → post → decode → set feePayer/blockhash if unsigned → deep-link to Mobile Wallet Adapter v2.2.9).
   **Why last:** Depends on Phase 3a emitting assessments with a `recommendedAction` field that resolves to the Action URL.

### Why this order

- **Phase 1 → 2 seam is the txline contract.** Get it right early; Phase 2 becomes a source swap.
- **Phase 3a → 3b seam is the RiskAssessment.** It carries the `recommendedAction` Action URL — Phase 3b only renders what the engine emits.
- **GPU/perf shape Phase 1.** The blur-budget cap and the layer-stack purity rule must be enforced from the first HUD widget; retrofitting them is expensive.
- **Solana spec compliance is phase-3 mechanical work.** `actions.json` and CORS headers are a checklist, not an open research question — sequence them after the engine exists, so demo risk signals are real before the wallet is wired.

### Research flags for phases

- **Phase 2:** TxLINE actual wire protocol (event schema, transport SSE/WebSocket/zmq, reconnect semantics) — likely needs phase-specific research. Architecturally we're betting on SSE; WebSocket would force a small wrapper rewrite at the `TxLineSource` boundary only.
- **Phase 3a:** Whether to compute risk purely client-side (recommended for hackathon) or whether to host a server-side inference step. Pure client is MVP; server-side is a deferred decision.
- **Phase 3b:** Solana `links.next` callback flow is the trickiest spec-compliance piece (same-origin POST callback with `{signature, account}`) — flag a spike before implementation.
- **Cross-phase:** iOS Safari `getUserMedia` user-gesture requirement and `backdrop-filter` layer-compositing quirks may surface during Phase 1 acceptance testing — PITFALLS.md covers these.

## Sources

- **Solana Actions + Blinks spec** — `https://solana.com/docs/advanced/actions` (official docs, webfetch, **HIGH**). Full ActionGetResponse/ActionPostResponse contract, `links.next` chaining, `actions.json` mapping, CORS requirements.
- **Solana Mobile Wallet Adapter v2.2.9** (released 2026-06-04) — `github.com/solana-mobile/mobile-wallet-adapter`, JS/Android/RN PWA deep-link signing for `signAndSendTransaction` (websearch, **HIGH**). Confirms PWA-native wallet signing without native wrapper.
- **CSS `backdrop-filter` Baseline 2024** — backdrop-root behavior, layer-compositing quirks, `will-change`/`opacity`/`transform` ancestor footgun (webfetch, **HIGH**). Critical for Pattern 1.
- **`getUserMedia()` MediaDevices API** — `developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia` (MDN, webfetch, **HIGH**). Secure-context requirement, `facingMode` constraints, error taxonomy, recording-indicator privacy rules.
- **Mobile sports companion landscape** — FotMob/Onefootball/365Scores/LiveScore/bet365/FanDuel feature survey (websearch, **MEDIUM**). Confirms AR/HUD overlay + AI risk + on-chain hedge is open greenfield; do NOT compete on feature parity with established apps.
- **Author domain expertise** — real-time transport choice (SSE vs WebSocket), client-side risk engine patterns, NeonChrome design system implications (PROJECT.md + DESIGN.md, **MEDIUM**) — used for architectural recommendation where no authoritative source was fruitfully fetchable given disabled search providers.

---
*Architecture research for: mobile AR/HUD sports companion + Solana Blinks hedge execution*
*Researched: 2026-07-06*