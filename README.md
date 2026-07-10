# BlinkEdge

**AR/HUD Football Companion for World Cup 2026**

## The Problem

Watching a World Cup match on TV with a live bet in play means constantly splitting attention between the broadcast and a second screen — refreshing odds, checking score updates, watching for red cards or injuries that could sink your position. By the time you see the risk and act, the market has already moved.

## Why It's Needed

Football betting is real-time, but the tools aren't. Fans watch on TV, bet on their phone, and manually juggle both. When a critical event happens — a red card at minute 67, a star player stretchered off — you have seconds to react before the odds shift. Existing apps show you data in isolation; they don't sit _on top_ of what you're already watching and they don't act for you.

## What BlinkEdge Does Differently

BlinkEdge is not another sportsbook app or a second-screen dashboard. It's an **AR overlay for the broadcast itself**:

- **Camera is the canvas.** Point your phone at the TV. Live score, odds, and consensus float directly over the match — no looking away, no context switch.
- **Widgets are translucent.** The broadcast stays visible _through_ the HUD panels. You don't lose the game.
- **Event-driven risk detection.** When a red card or injury happens, the TxEdge engine catches it immediately and surfaces a hedge prompt — no polling, no manual refresh.
- **One-tap hedge on Solana.** The hedge action is a Solana Blink — tap to sign, done. Wallet confirmation is the only extra step.
- **NeonChrome design.** Dark chrome + neon glow makes the HUD readable over a bright TV broadcast without obscuring it.

Existing approach: watch on TV, check phone for odds, refresh for events, open betting app, place hedge. **Four context switches, one of which you'll miss.**

BlinkEdge: point phone at TV → HUD appears → red card triggers alert → tap to hedge. **Zero context switches.**

Built for the **FIFA Solana 2026 Hackathon**.

---

## Demo

**Live:** [https://blinkedge.onrender.com](https://blinkedge.onrender.com)

**Action endpoint:** [https://blinkedge.onrender.com/api/actions/hedge/wc-2026-final](https://blinkedge.onrender.com/api/actions/hedge/wc-2026-final)

**Validate with Blinks Inspector:** [https://dial.to/developer?url=https://blinkedge.onrender.com/api/actions/hedge/wc-2026-final](https://dial.to/developer?url=https://blinkedge.onrender.com/api/actions/hedge/wc-2026-final)

**Phase 1 + Phase 3b (current):** Camera feed + AR HUD overlays + live risk engine + one-tap Solana Blink hedge on devnet.

---

## Core Value

> A fan can see live match data floating over their TV broadcast without looking away from the game, and can protect their capital with one tap when bad events happen.

---

## Features

### Phase 1 — Walking Skeleton ✓

- **Camera-as-canvas** — Rear camera feed fills the viewport; the broadcast is visible through translucent HUD widgets
- **Live Scoreboard** — Top-center HUD card with neon cyan glow, showing live score + match minute
- **Odds Matrix** — Right-edge HUD card with neon magenta glow, displaying 1/X/2 betting odds
- **Consensus Indicator** — Bottom-center HUD card with neon acid-green glow, showing market direction + possession bar
- **Mock TxLINE Stream** — Deterministic in-memory event stream (2000ms tick) simulating goals, cards, injuries, odds shifts
- **NeonChrome Design System** — Dark chrome canvas (#0a0a0f) with glow-as-depth, cyan/magenta/acid-green neon accents, backdrop-blur overlays
- **PWA Shell** — Installable, standalone, portrait, full-screen (100dvh, safe-area insets)

### Phase 2 — Live Data (planned)

- Real TxLINE on Solana data stream integration
- Match selection (manual fixture select or broadcast recognition)
- Service worker with offline shell
- Responsive enhancement at tablet/desktop breakpoints

### Phase 3a — TxEdge Risk Engine ✓

- **Pure-function risk engine** — Declarative rules, unit-testable, no React dependency
- **Rule-based triggers:**
  - `red-card` — New red card event → critical
  - `injury` — New injury event → high
  - `odds-swing` — Odds delta > 18% → high
  - `lead-reversal` — Score lead flips → critical
- **RiskEngineProvider** — Subscribes to TxLineProvider, evaluates each tick, exposes active risk

### Phase 3b — Solana Blinks ✓ (current)

- **Solana Actions endpoint** — `GET` metadata + `POST` transaction at `/api/actions/hedge/[marketId]`
- **`actions.json`** at domain root with CORS `*` for wallet discovery
- **SolanaTransactionService** — Builds SystemProgram transfer + ComputeBudget priority fee (median×2, always set)
- **WalletProvider** — Phantom + Solflare adapters, `autoConnect: false` (never wrong-cluster)
- **BlinkHedgeCard** — Full Action client flow: `GET` metadata → `POST` transaction → wallet sign → confirmed
- **RiskAlertSheet** — z-30 bottom sheet, slides up on risk detection, "Hedge Now" CTA
- **Devnet only** — No mainnet RPC, visible cluster badge + truncated pubkey, no real value at risk

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    App Shell (100dvh)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           CameraBackdrop (<video>) z:0                    │  │
│  │              rear camera feed                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │   Scoreboard (top center)        z:20               │  │  │
│  │  │   OddsMatrix (right edge)        z:20               │  │  │
│  │  │   ConsensusIndicator (bottom)    z:20               │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │   RiskAlertSheet (bottom sheet)     z:30            │  │  │
│  │  │     ↓ onHedge                                        │  │  │
│  │  │   BlinkHedgeCard (modal)            z:40            │  │  │
│  │  │     GET /api/actions/hedge/[marketId]                │  │  │
│  │  │     POST → base64 tx → wallet sign → confirmed       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
          ▲                  ▲                      ▲
          │                  │                      │
    userMedia (cam)    TxLineProvider          WalletProvider
                       (mock, 2s tick)        (Phantom/Solflare)
                       │                       │
                  TxLineSource           Solana devnet
                       │                  (priority fee always)
             ┌─────────┴─────────┐
             │  mockData.ts      │  real TxLINE API
             │  (Phase 1)        │  (Phase 2+)
             └───────────────────┘
                       │
                 RiskEngineProvider
                 (evaluate prev→cur)
                       │
             ┌─────────┴─────────┐
             │ red-card  injury   │
             │ odds-swing reversal│
             └───────────────────┘
```

### Data Flow

```
TxLINE (mock/source) → TxLineProvider (React Context) → HUD Widgets
                              ↓
                    Zod-validated TxLineEventPacket
                    (matchId, minute, score, possession,
                     events[], oddsSnapshot, consensus)
```

### Layer Stack

| Layer            | Technology                                                |
| ---------------- | --------------------------------------------------------- |
| Framework        | Next.js 16 (App Router) + TypeScript                      |
| Styling          | Tailwind CSS 4 + NeonChrome @theme tokens                 |
| Validation       | Zod (TxLineEventPacket schema)                            |
| Camera           | Web Media API (`getUserMedia`, `facingMode: environment`) |
| State            | React Context (TxLineProvider)                            |
| PWA              | Web App Manifest, `100dvh` + `safe-area-inset`            |
| Solana (Phase 3) | `@solana/web3.js`, `@solana/actions`, Wallet Adapter      |

---

## NeonChrome Design System

BlinkEdge uses a custom **NeonChrome** design language — dark metallic surfaces with glowing neon borders. Depth comes entirely from glow intensity.

| Token         | Value                     | Usage                                       |
| ------------- | ------------------------- | ------------------------------------------- |
| Canvas        | `#0a0a0f`                 | Page background (never pure black)          |
| Primary       | `#00f0ff` (Electric Cyan) | Scoreboard, CTAs, brand accent              |
| Magenta       | `#ff00e5` (Hot Magenta)   | OddsMatrix, error states                    |
| Acid          | `#39ff14` (Acid Green)    | Consensus indicator, success                |
| Amber         | `#ffb800`                 | Warnings, hedge alerts                      |
| Surface       | `rgba(10,10,15,0.35)`     | HUD widget backgrounds (TV visible through) |
| Chrome Border | `rgba(255,255,255,0.06)`  | Subtle surface dividers                     |

Typography uses **Inter** (UI, weights 400–800) and **JetBrains Mono** (scores, data). Full design specification at [`DESIGN.md`](./DESIGN.md).

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- iOS Safari 15+ or Android Chrome (for camera API)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on a mobile device or emulator. **Camera API requires HTTPS** — use `ngrok` or a tunnel for mobile testing.

### Build

```bash
npm run build
```

### Test

```bash
npm test            # vitest
npm run test:watch  # watch mode
npm run test:coverage
```

### Lint

```bash
npm run lint
```

---

## Project Structure

```
BlinkEdge/
├── app/
│   ├── layout.tsx              # Root layout + PWA metadata
│   ├── page.tsx                # Main canvas (camera + HUD + hedge flow)
│   ├── manifest.ts             # PWA manifest (standalone, portrait)
│   ├── icon.tsx / apple-icon.tsx  # Dynamic app icons
│   ├── globals.css             # NeonChrome @theme + component classes
│   ├── actions.json/route.ts   # Solana Actions discovery (CORS *)
│   ├── api/
│   │   └── actions/hedge/[marketId]/route.ts  # GET metadata + POST tx
│   └── components/
│       ├── CameraBackdrop.tsx     # Rear camera <video> feed
│       ├── Scoreboard.tsx         # Live score + minute (top-center)
│       ├── OddsMatrix.tsx         # 1/X/2 odds (right-edge)
│       ├── ConsensusIndicator.tsx # Market direction + possession
│       ├── WalletProvider.tsx     # Solana wallet adapter (Phantom+Solflare)
│       ├── RiskAlertSheet.tsx     # z-30 bottom sheet, risk → hedge CTA
│       ├── BlinkHedgeCard.tsx     # z-40 Action client (GET→POST→sign→confirmed)
│       └── HedgeFlow.tsx         # Orchestrates RiskAlertSheet + BlinkHedgeCard
├── lib/
│   ├── txline/
│   │   ├── TxLineProvider.tsx   # React Context, 2s tick
│   │   ├── TxLineSource.ts      # Source interface (decouples mock → live)
│   │   └── mockData.ts          # Deterministic seeded event generator
│   ├── schema/
│   │   └── txLineSchema.ts      # Zod schema for TxLineEventPacket
│   ├── risk/
│   │   ├── types.ts             # RiskAssessment types
│   │   ├── riskEngine.ts        # Pure-function rules (red card, injury, swing, reversal)
│   │   └── RiskEngineProvider.tsx # Subscribes to TxLine, exposes active risk
│   ├── solana/
│   │   └── SolanaTransactionService.ts # Devnet tx builder (priority fee always)
│   └── perf/
│       └── blurBudget.ts        # GPU blur budget tracking
├── design-system/blinkedge/     # Design system assets
├── .planning/                   # GSD planning docs
├── DESIGN.md                    # Full NeonChrome specification
└── next.config.mjs
```

---

## Key Technologies

### TxLINE Data Stream

The `TxLineEventPacket` schema (Zod-validated) is the single source of truth:

```typescript
{
  matchId: string;
  timestamp: number;
  minute: number;          // 0–120
  score: { home: number; away: number };
  possession: { home: number; away: number };  // 0–100
  events: TxLineEvent[];   // goal, card, injury, odds_change, substitution
  oddsSnapshot: { home: number; draw: number; away: number };
  consensus: { direction: "home" | "draw" | "away"; confidence: number };
}
```

The `TxLineSource` interface decouples data ingestion from presentation:

- **Phase 1:** `createMockTxLineSource()` — deterministic seeded PRNG, 2000ms tick
- **Phase 2+:** Real TxLINE on Solana (implements same interface)

### TxEdge Risk Engine ✓ (Phase 3a)

Pure reducer: `evaluate(prevPacket, curPacket) → RiskAssessment[]`

| Rule            | Trigger            | Severity  | Action        |
| --------------- | ------------------ | --------- | ------------- |
| `red-card`      | New red card event | critical  | Hedge alert   |
| `injury`        | New injury event   | high      | Hedge alert   |
| `odds-swing`    | `                  | oddsDelta | > 0.18`       | high | Risk warning |
| `lead-reversal` | Score lead flips   | critical  | Re-evaluation |

Rules are declarative and additive — new rules drop into the `rules[]` array with no refactoring.

### Solana Blinks ✓ (Phase 3b)

- `actions.json` at domain root (`Access-Control-Allow-Origin: *`)
- `GET /api/actions/hedge/[marketId]` → Action metadata (title, description, icon)
- `POST /api/actions/hedge/[marketId]` → Base64-encoded transaction (Devnet hedge voucher)
- `SolanaTransactionService` — `setComputeUnitPrice` (median×2) + `setComputeUnitLimit` (200k) always set
- `WalletProvider` — Phantom + Solflare, `autoConnect: false` (never wrong-cluster)
- `BlinkHedgeCard` — Full client flow: `GET` metadata → `POST` tx → wallet sign → confirmed
- Visible devnet cluster badge + truncated pubkey — no ambiguity about which network

---

## Performance Budget

| Constraint    | Target                                                  |
| ------------- | ------------------------------------------------------- |
| Frame rate    | ≥30fps on mid-range mobile (Pixel 4a / iPhone SE 2)     |
| Backdrop-blur | Max **3 concurrent** elements                           |
| GPU hints     | `will-change: backdrop-filter`, `contain: layout paint` |
| `<video>`     | `object-fit: cover` (GPU-composited, no JS resize)      |
| Tick cadence  | 2000ms (TxLINE mock, matches real data rate)            |

---

## Mobile-First Layout

| Breakpoint       | Width      | Layout Changes                                                               |
| ---------------- | ---------- | ---------------------------------------------------------------------------- |
| Default (mobile) | ≤425px     | Scoreboard full-width top, OddsMatrix collapsed, Consensus full-width bottom |
| `sm:`            | 426–767px  | OddsMatrix expands to right-edge                                             |
| `md:`            | 768–1023px | Scoreboard clamps to `max-w-480` centered                                    |
| `lg:`            | ≥1024px    | Full desktop framing                                                         |

Base classes target mobile; `sm:`/`md:`/`lg:` prefixes add layout.

---

## Roadmap

### Phase 1 — Walking Skeleton ✓

Camera + HUD widgets + mock data + hedge placeholder.

### Phase 3a — TxEdge Risk Engine ✓

- Pure-function risk detection reducer
- Rule-based triggers (red card, injury, odds swing, lead reversal)
- Unit-testable, independent of React

### Phase 3b — Solana Blinks ✓ (current)

- Solana Actions endpoint (`GET` metadata, `POST` transaction)
- Wallet adapter integration (Phantom, Solflare)
- One-tap hedge execution via Mobile Wallet Adapter
- Devnet "hedge voucher" (SystemProgram transfer with priority fee)
- `autoConnect: false` (never wrong-cluster)

### Phase 2 — Live Data & Polish (next)

- Real TxLINE data stream integration
- Match selection (manual or broadcast recognition)
- Service worker with offline shell
- Responsive enhancement

---

## Contributing

This is a hackathon project. PRs and issues welcome for discussion.

---

## License

MIT
