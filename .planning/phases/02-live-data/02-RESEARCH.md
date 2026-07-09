# Phase 02: Live Data — Research

**Researched:** 2026-07-09
**Domain:** Real-time SSE data streaming, PWA/service worker, match selection UI
**Confidence:** HIGH (TxLINE docs, serwist docs, existing codebase all verified)

## Summary

Phase 2 replaces the mock data source (`createMockTxLineSource()`) with a real TxLINE-on-Solana SSE data stream. The main work is building `TxLineSseSource` (implements `TxLineSource` interface) with a data adapter that maps the TxLINE wire format to `TxLineEventPacket`. Two SSE streams must be consumed — `/api/odds/stream` and `/api/scores/stream` — and merged into a single packet. The existing `TxLineProvider` is extended with `useReducer` for live data and a separate `useReducer` for the app state machine (`LOADING → MATCH_SELECT → CAMERA_INIT → AR_HUD_LIVE / OFFLINE / API_ERROR`).

Four new UI components are needed (`MatchSelector`, `MatchCard`, `ApiStatusIndicator`, `DataErrorBanner`, `SwUpdateNotification`) per the UI-SPEC contracts. A serwist PWA/service worker is added with full offline shell caching and update banner.

**Critical finding:** D-03 in CONTEXT.md says "Use native `EventSource` API" but the TxLINE API requires custom HTTP headers (`Authorization: Bearer {jwt}` and `X-Api-Token: {apiToken}`) which the native `EventSource` API **cannot** set. The TxLINE official docs use `fetch()` + an `async generator` SSE parser instead. The planner must switch to `fetch`-based SSE.

**Primary recommendation:** Use `fetch`-based SSE with the TxLINE-provided `readSseMessages` async generator pattern, not native `EventSource`. Use `@serwist/turbopack@9.5.11` for the PWA (project uses Turbopack). Seed 2-3 real fixture IDs from the TxLINE schedule (World Cup Quarter-finals/Round of 32 — `18209181` for France vs Morocco on July 9 matches "today").

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** SSE transport (TxLINE native) — confirmed, but implementation must use `fetch` not `EventSource` (see critical finding)
- **D-02:** Devnet shortcut — devnet wallet, free World Cup tier, activate via `/api/token/activate`
- **D-03:** Native `EventSource` API — **OVERRIDDEN:** TxLINE requires custom headers; use `fetch` + async generator SSE parser
- **D-04:** Subscribe to both scores and odds SSE streams
- **D-05:** `TxLineSseSource` implements `TxLineSource` + data adapter/mapper
- **D-06:** Extend `TxLineProvider` with `useReducer` for data + connection metadata
- **D-07:** Separate `useReducer` for app state machine (`LOADING → MATCH_SELECT → CAMERA_INIT → AR_HUD_LIVE / OFFLINE / API_ERROR`)
- **D-08:** Connection status via internal event bus → React Context → `useConnectionStatus()` hook
- **D-09:** Inline state toggle in `page.tsx` (no routes)
- **D-10:** Fade transition ~300ms between match list and camera view
- **D-11:** Manually seeded fixture IDs (2-3 hardcoded)
- **D-12:** Use `serwist` for PWA/SW
- **D-13:** Full offline shell — cache match list and camera HUD layout
- **D-14:** Update banner with "New Update Available" / "Refresh Now" button

### the agent's Discretion
- TxODDS SSE event format mapping details (exact field mapping to TxLineEventPacket)
- Exact retry backoff schedule (e.g., 1s, 2s, 4s, 8s max)
- Connection status dot colors per UI-SPEC (already defined in visual contract)
- Implementation details of the fade transition CSS

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIVE-01 | Real TxLINE on Solana data stream integration (replaces mock TxLineProvider) | TxLINE SSE docs confirmed: scores + odds streams via `fetch`, auth via JWT + API token. Adapter maps to `TxLineEventPacket`. World Cup free tier (Service Level 1) active on devnet. |
| LIVE-02 | Match selection (manual fixture select) | UI-SPEC defines MatchSelector + MatchCard components. Fixture IDs from TxLINE schedule (`18209181`, `18172489`, etc.). Inline state toggle in page.tsx. No REST fixture fetch needed — hardcoded IDs. |
| LIVE-03 | TxLINE wire protocol (SSE vs WebSocket, Last-Event-ID resumption) | TxLINE uses SSE only. Docs show `fetch`-based SSE with `readSseMessages` async generator. Custom headers required (`Authorization`, `X-Api-Token`). No Last-Event-ID needed in free tier (historical not streamed for free). |
| OFFL-01 | Service worker via serwist (was `@ducanh2912/next-pwa`) | `@serwist/turbopack@9.5.11` confirmed on npm registry. Project uses Turbopack so `@serwist/turbopack` Route Handler approach is correct. Full offline shell via precaching + `/~offline` fallback. |
| OFFL-02 | Offline shell with cached HUD layout | `serwist` config with `fallbacks: { entries: [{ url: "/~offline", matcher: document }] }`. Additional precache of match list and camera HUD routes. Update banner via SwUpdateNotification component. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SSE stream connection | Browser / Client | — | SSE is a client-side protocol; all connection mgmt in the browser |
| Data adapter (TxODDS → TxLineEventPacket) | Browser / Client | — | Pure function; transforms wire format on arrival |
| Connection state tracking | Browser / Client | — | Event bus + React Context; client-only concern |
| App state machine | Browser / Client | — | React `useReducer` for UI flow; no server involvement |
| Match selection UI | Browser / Client | — | Client component with match list, no SSR needed |
| Service worker registration | CDN / Static | — | SW served as static asset; registered client-side |
| Offline shell caching | CDN / Static | — | Precached during build; served from SW cache |
| API auth (JWT + token) | Browser / Client | API / Backend | Token obtained client-side (guest JWT from `POST /auth/guest/start`); API token from `POST /api/token/activate` |
| TxODDS subscription | API / Backend (TxLINE) | — | On-chain Solana subscription; TxLINE off-chain API handles data delivery |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| serwist | ^9.5.11 | Service worker / PWA | Decision D-12; actively maintained fork, Turbopack-compatible |
| @serwist/turbopack | ^9.5.11 | Serwist Next.js Turbopack integration | Project uses Turbopack (`next.config.mjs`); Route Handler approach |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @serwist/next | ^9.5.11 | Serwist Next.js webpack integration | Only if switching from Turbopack to webpack (not recommended) |
| esbuild | (bundled with serwist) | Service worker bundling | Used internally by `@serwist/turbopack`'s Route Handler |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @serwist/turbopack | next-pwa (abandoned) | next-pwa@5.6.0 abandoned, no Next.js 16 support |
| @serwist/turbopack | @ducanh2912/next-pwa | @serwist is the maintained fork, supports Turbopack |
| Fetch-based SSE | Native EventSource | EventSource cannot set custom headers (TxLINE requires Authorization + X-Api-Token headers) |

**Installation:**
```bash
npm install serwist @serwist/turbopack
```

**Version verification:**
```bash
npm view @serwist/turbopack version
# → 9.5.11 (verified 2026-07-09)
```

## Package Legitimacy Audit

> **Required** whenever this phase installs external packages. Run the Package Legitimacy Gate protocol before completing this section.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| serwist | npm | ~2.5 yrs (first published Dec 2023) | ~500K+/wk (est.) | github.com/serwist/serwist | OK | Approved |
| @serwist/turbopack | npm | ~1 yr (first published Jul 2025) | ~50K+/wk (est.) | github.com/serwist/serwist | OK | Approved |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                             │
│                                                                     │
│  ┌──────────┐   ┌───────────────────────────────────────────────┐  │
│  │  page.tsx │   │              TxLineProvider                   │  │
│  │           │   │                                               │  │
│  │ AppState  │──▶│  ┌─────────────────┐  ┌───────────────────┐  │  │
│  │ useReducer│   │  │ TxLineSseSource  │  │ useTxLine() hook  │  │  │
│  │           │   │  │                  │  │ (existing)        │  │  │
│  │ LOADING → │   │  │ subscribe(cb) ──▶│  │                   │  │  │
│  │ MATCH_    │   │  │  → fetch SSE    │  │  TxLineEventPacket│  │  │
│  │ SELECT →  │   │  │  → adapter     │  │  │ null             │  │  │
│  │ CAMERA_   │   │  │  → validate    │  │  └───────────────────┘  │  │
│  │ INIT →    │   │  │  → callback    │  │                         │  │
│  │ AR_HUD_   │   │  └───────┬─────────┘  ┌───────────────────┐  │  │
│  │ LIVE /    │   │          │            │useConnectionStatus│  │  │
│  │ OFFLINE / │   │          │  ┌─────────│() hook            │  │  │
│  │ API_ERROR │   │          │  │         │                   │  │  │
│  └─────┬─────┘   │   ┌──────▼──▼──────┐  │ connecting       │  │  │
│        │         │   │ EventBus (conn)│  │ connected        │  │  │
│        │         │   │                │  │ reconnecting     │  │  │
│        ▼         │   │ SSE reconnect  │  │ disconnected     │  │  │
│  ┌──────────────┐│   │ backoff        │  │ stale            │  │  │
│  │ MatchSelector││   │ maxRetries     │  └───────────────────┘  │  │
│  │ MatchCard    ││   └────────────────┘                         │  │
│  └──────────────┘│                                               │  │
│                  │  ┌──────────────────────────────────────────┐ │  │
│  ┌─────────────┐ │  │  SSRFetchService (TxLINE API Client)    │ │  │
│  │ApiStatus    │ │  │                                          │ │  │
│  │Indicator    │ │  │  GET /auth/guest/start → JWT             │ │  │
│  │DataError    │ │  │  POST /api/token/activate → apiToken     │ │  │
│  │Banner       │ │  │  GET /api/scores/stream (SSE)            │ │  │
│  └─────────────┘ │  │  GET /api/odds/stream (SSE)              │ │  │
│                  │  └────────────────┬─────────────────────────┘ │  │
│  ┌─────────────┐ │                   │                           │  │
│  │SwUpdate     │ │                   ▼                           │  │
│  │Notification │ │         ◄─── TxLINE Off-Chain API ───►        │  │
│  └─────────────┘ │                                               │  │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────────┐
            │  Service Worker (serwist)   │
            │                             │
            │  Precached:                 │
            │  • / (match list + HUD)    │
            │  • /~offline (offline shell)│
            │  • static assets (CSS, JS) │
            │                             │
            │  Runtime cache:             │
            │  • API responses (stale-    │
            │    while-revalidate)        │
            │                             │
            │  Update banner triggers     │
            │  on new SW detected         │
            └─────────────────────────────┘
```

### Component Flow

```
User opens app
    │
    ▼
[LOADING] ──health check──► [MATCH_SELECT]
    │                              │
    │                              │ user taps match
    │                              ▼
    │                         [CAMERA_INIT]
    │                              │
    │                   ┌──────────┴──────────┐
    │                   │                     │
    │                   ▼                     ▼
    │              [AR_HUD_LIVE]        [API_ERROR / OFFLINE]
    │              camera + live        cached shell or
    │              TxODDS data          error + retry
    │                   │
    │        ┌──────────┴──────────┐
    │        │                     │
    │        ▼                     ▼
    │   disconnected          stale (>30s)
    │   (API_ERROR)           (amber banner)
    │   magenta dot           amber pulse dot
```

### Recommended Project Structure
```
app/
├── components/
│   ├── MatchSelector.tsx       # NEW — match list pre-camera
│   ├── MatchCard.tsx           # NEW — single match row (or inline)
│   ├── ApiStatusIndicator.tsx  # NEW — connection status dot + pill
│   ├── DataErrorBanner.tsx     # NEW — API error/offline overlay
│   └── SwUpdateNotification.tsx # NEW — SW update banner
├── sw.ts                       # NEW — service worker entry
├── ~offline/
│   └── page.tsx                # NEW — offline fallback page
└── layout.tsx                  # MODIFIED — add SerwistProvider

lib/txline/
├── TxLineSource.ts             # UNCHANGED — subscription interface
├── TxLineProvider.tsx           # MODIFIED — extend with useReducer(s)
├── mockData.ts                 # REPLACED — no longer imported by default
├── txLineSseSource.ts          # NEW — implements TxLineSource
├── txLineSseAdapter.ts         # NEW — TxODDS → TxLineEventPacket mapper
├── txLineConnectionBus.ts      # NEW — connection state event bus
├── useConnectionStatus.ts      # NEW — hook wrapping connection context
├── txLineAppMachine.ts         # NEW — app state reducer (LOADING → ...)
├── txLineFixtureIds.ts         # NEW — hardcoded fixture ID config
└── txLineAuth.ts               # NEW — JWT + API token flow

next.config.mjs                 # MODIFIED — add serwist config
```

### Pattern 1: Fetch-Based SSE Stream Consumption
**What:** Use `fetch` with SSE parsing async generator (per TxLINE docs) instead of native `EventSource` (which cannot set custom auth headers).
**When to use:** All SSE connections to TxLINE API.
**Source:** [CITED: https://txline.txodds.com/documentation/examples/streaming-data]

```typescript
// lib/txline/txLineSseSource.ts
type SseMessage = {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
};

async function* readSseMessages(response: Response): AsyncGenerator<SseMessage> {
  if (!response.body) throw new Error("Stream response has no body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let separator = buffer.match(/\r?\n\r?\n/);
      while (separator?.index !== undefined) {
        const block = buffer.slice(0, separator.index);
        buffer = buffer.slice(separator.index + separator[0].length);
        const message = parseSseBlock(block);
        if (message) yield message;
        separator = buffer.match(/\r?\n\r?\n/);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseSseBlock(block: string): SseMessage | null {
  const message: SseMessage = { data: "" };
  for (const rawLine of block.split(/\r?\n/)) {
    if (!rawLine || rawLine.startsWith(":")) continue;
    const separatorIndex = rawLine.indexOf(":");
    const field = separatorIndex === -1 ? rawLine : rawLine.slice(0, separatorIndex);
    const value = separatorIndex === -1 ? "" : rawLine.slice(separatorIndex + 1).replace(/^ /, "");
    if (field === "data") message.data += `${value}\n`;
    if (field === "event") message.event = value;
    if (field === "id") message.id = value;
    if (field === "retry") message.retry = Number(value);
  }
  message.data = message.data.replace(/\n$/, "");
  return message.data || message.event || message.id ? message : null;
}
```

### Pattern 2: Connection Status Event Bus
**What:** Lightweight typed event emitter for tracking SSE connection lifecycle, wrapped in React Context.
**When to use:** For the `useConnectionStatus()` hook (D-08).

```typescript
// lib/txline/txLineConnectionBus.ts
export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected" | "stale";

type ConnectionListener = (state: ConnectionState, meta?: { lastPacket?: number; retryCount?: number }) => void;

export class ConnectionEventBus {
  private listeners = new Set<ConnectionListener>();
  private _state: ConnectionState = "disconnected";

  get state() { return this._state; }

  setState(state: ConnectionState, meta?: Parameters<ConnectionListener>[1]) {
    this._state = state;
    this.listeners.forEach((l) => l(state, meta));
  }

  subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
```

### Pattern 3: App State Machine Reducer
**What:** Separate `useReducer` for app-level state transitions, decoupled from data layer.
**When to use:** For managing the LOADING → MATCH_SELECT → CAMERA_INIT → AR_HUD_LIVE / OFFLINE / API_ERROR flow.

```typescript
// lib/txline/txLineAppMachine.ts
export type AppState =
  | { phase: "LOADING" }
  | { phase: "MATCH_SELECT" }
  | { phase: "CAMERA_INIT"; selectedMatchId: number }
  | { phase: "AR_HUD_LIVE"; selectedMatchId: number }
  | { phase: "OFFLINE" }
  | { phase: "API_ERROR"; error: string };

export type AppAction =
  | { type: "LOADED" }
  | { type: "SELECT_MATCH"; matchId: number }
  | { type: "CAMERA_READY" }
  | { type: "GO_OFFLINE" }
  | { type: "API_ERROR"; error: string }
  | { type: "RETRY" }
  | { type: "GO_BACK" };

export function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (state.phase) {
    case "LOADING":
      if (action.type === "LOADED") return { phase: "MATCH_SELECT" };
      if (action.type === "API_ERROR") return { phase: "API_ERROR", error: action.error };
      return state;
    case "MATCH_SELECT":
      if (action.type === "SELECT_MATCH") return { phase: "CAMERA_INIT", selectedMatchId: action.matchId };
      if (action.type === "GO_OFFLINE") return { phase: "OFFLINE" };
      return state;
    case "CAMERA_INIT":
      if (action.type === "CAMERA_READY") return { phase: "AR_HUD_LIVE", selectedMatchId: state.selectedMatchId };
      if (action.type === "API_ERROR") return { phase: "API_ERROR", error: action.error };
      if (action.type === "GO_OFFLINE") return { phase: "OFFLINE" };
      return state;
    case "AR_HUD_LIVE":
      if (action.type === "API_ERROR") return { phase: "API_ERROR", error: action.error };
      if (action.type === "GO_OFFLINE") return { phase: "OFFLINE" };
      if (action.type === "GO_BACK") return { phase: "MATCH_SELECT" };
      return state;
    case "API_ERROR":
      if (action.type === "RETRY") return { phase: "LOADING" };
      if (action.type === "GO_BACK") return { phase: "MATCH_SELECT" };
      return state;
    case "OFFLINE":
      if (action.type === "RETRY") return { phase: "LOADING" };
      if (action.type === "GO_BACK") return { phase: "MATCH_SELECT" };
      return state;
  }
}
```

### Anti-Patterns to Avoid
- **Native EventSource for TxLINE:** EventSource cannot set `Authorization` or `X-Api-Token` headers. TxLINE requires both. Use `fetch` + async generator SSE parser. [CITED: TxLINE docs]
- **Storing JWT or API token in localStorage/IndexedDB:** JWT has 30-day expiry; store in memory only (refetch on page reload). The token is session-scoped.
- **Single SSE connection for both scores and odds:** TxLINE provides separate `/api/scores/stream` and `/api/odds/stream` endpoints. Must connect both and merge packets.
- **Re-render storm on each SSE event:** The `fetch` approach decodes each SSE chunk which may batch multiple events. Buffer with `requestAnimationFrame` or a small debounce before dispatching to React state.
- **Using `serwist` with webpack plugin on a Turbopack project:** `@serwist/next` is a webpack plugin. Project uses Turbopack (next.config.mjs has `turbopack` config). Use `@serwist/turbopack` instead — it uses a Route Handler approach that works with any bundler.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker / PWA offline | Custom SW cache logic | `serwist` + `@serwist/turbopack` | SW caching edge cases (precache manifest, versioning, update flow, cache invalidation) are deceptively complex. serwist handles all of them. |
| SSE parser from raw stream | Custom binary→text→event parser | Copy TxLINE's `readSseMessages` async generator | The SSE protocol has edge cases (multiline data, comments, retry fields). TxLINE provides a tested parser in their docs. |
| Exponential backoff retry | Custom reconnect logic | Copy pattern from `readSseMessages` wrapper | Reconnection with jitter, max retries, stale detection is ~40 lines of well-understood code. Don't import a library. |

**Key insight:** The TxLINE docs provide a complete, tested SSE parser and streaming pattern. Copy it rather than reimplementing. The hard part of this phase is the data adapter (mapping TxODDS scores + odds wire format to `TxLineEventPacket`) — that's where custom logic belongs.

## Common Pitfalls

### Pitfall 1: Native EventSource Cannot Set Custom Headers
**What goes wrong:** D-03 specifies `EventSource` API, but TxLINE requires `Authorization: Bearer {jwt}` and `X-Api-Token: {apiToken}` headers. EventSource does not support custom headers.
**Why it happens:** EventSource is a simple API designed for unauthenticated or cookie-auth SSE. TxLINE uses per-request bearer tokens.
**How to avoid:** Use `fetch()` with SSE parsing (TxLINE-documented pattern). The `TxLineSseSource.subscribe()` method should initiate a `fetch` with headers, then iterate `readSseMessages()`.
**Warning signs:** HTTP 401 or 403 errors when connecting SSE.

### Pitfall 2: Two SSE Streams Need Packet Merging
**What goes wrong:** The scores and odds streams emit separate events at different cadences. A naive approach would miss one or the other.
**Why it happens:** The `TxLineEventPacket` schema requires both scores (score, minute, events, possession) and odds (oddsSnapshot, consensus) in a single packet.
**How to avoid:** Maintain a merged state object. When a scores event arrives, update score fields and emit. When an odds event arrives, update odds fields and emit. Either emission dispatches the full merged packet via the subscriber callback.

### Pitfall 3: serwist Webpack Plugin Won't Work with Turbopack
**What goes wrong:** Installing `@serwist/next` (the webpack plugin) and wrapping `withSerwist()` around next.config will fail silently or produce build errors.
**Why it happens:** `next.config.mjs` is configured with `turbopack: { root: import.meta.dirname }`. The `@serwist/next` plugin hooks into webpack lifecycle events that don't exist in Turbopack.
**How to avoid:** Use `@serwist/turbopack` instead. This package uses a Next.js Route Handler to compile the SW at build time via SSG, not a webpack plugin.

### Pitfall 4: JWT Expiry After 30 Days
**What goes wrong:** The guest JWT from `/auth/guest/start` expires after 30 days. If the app tries to reuse a stale JWT, all SSE connections will get 401 errors.
**Why it happens:** TxLINE's JWT has a fixed 30-day lifespan. The current mock implementation has no auth.
**How to avoid:** Handle 401 responses in the SSE connection loop by re-fetching a fresh JWT from `/auth/guest/start`. The TxLINE docs specifically mention this: "respond to the returned HTTP 401 code by reacquiring a fresh JWT token."

### Pitfall 5: Camera Teardown Must Not Disconnect SSE
**What goes wrong:** The CameraBackdrop handles visibilitychange (CAM-06) by stopping the camera stream. This should NOT affect the SSE connection — SSE should survive visibility changes.
**Why it happens:** Both camera and SSE are initialized on page load. Naive cleanup in useEffect might tear down both.
**How to avoid:** Keep SSE connection lifecycle independent of camera lifecycle. The TxLineProvider manages SSE; CameraBackdrop manages camera. They share no lifecycle dependencies.

## Code Examples

### TxLineSseSource Implementation Pattern
```typescript
// lib/txline/txLineSseSource.ts
import type { TxLineSource } from "./TxLineSource";
import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";
import { type ConnectionState, ConnectionEventBus } from "./txLineConnectionBus";
import { mergeScoresAndOdds } from "./txLineSseAdapter";

const DEVNET_ORIGIN = "https://txline-dev.txodds.com";
const STALE_THRESHOLD_MS = 30_000;

interface SseSourceConfig {
  jwt: string;
  apiToken: string;
  fixtureId: number;
  onConnectionChange?: (state: ConnectionState, meta?: any) => void;
}

export function createTxLineSseSource(config: SseSourceConfig): TxLineSource & { connectionBus: ConnectionEventBus } {
  const connectionBus = new ConnectionEventBus();
  const subscribers = new Set<(packet: TxLineEventPacket) => void>();

  // Merged state: scores arrive in one stream, odds in another
  let mergedState: Partial<TxLineEventPacket> = {};
  let lastPacketTime = 0;
  let abortController: AbortController | null = null;

  async function connectStream(url: string, parser: (data: any) => Partial<TxLineEventPacket>) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.jwt}`,
        "X-Api-Token": config.apiToken,
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      signal: abortController?.signal,
    });

    if (!response.ok) throw new Error(`SSE failed: ${response.status}`);

    for await (const message of readSseMessages(response)) {
      const data = JSON.parse(message.data);
      const partial = parser(data);
      mergedState = { ...mergedState, ...partial };
      lastPacketTime = Date.now();

      // Emit merged packet to all subscribers
      const packet = mergedState as TxLineEventPacket;
      subscribers.forEach((cb) => cb(packet));
    }
  }

  // Exponential backoff with jitter
  async function connectWithRetry(maxRetries = 5) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      connectionBus.setState(attempt === 0 ? "connecting" : "reconnecting", { retryCount: attempt });
      try {
        abortController = new AbortController();
        await Promise.all([
          connectStream(`${DEVNET_ORIGIN}/api/scores/stream`, parseScoreEvent),
          connectStream(`${DEVNET_ORIGIN}/api/odds/stream`, parseOddsEvent),
        ]);
        connectionBus.setState("connected");
        return;
      } catch (err) {
        if (abortController?.signal.aborted) break;
        const delay = Math.min(1000 * Math.pow(2, attempt), 8000) + Math.random() * 500;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    connectionBus.setState("disconnected");
  }

  return {
    subscribe(callback: (packet: TxLineEventPacket) => void): () => void {
      subscribers.add(callback);
      if (subscribers.size === 1) {
        connectWithRetry();
        // Stale detection interval
        setInterval(() => {
          if (Date.now() - lastPacketTime > STALE_THRESHOLD_MS && lastPacketTime > 0) {
            connectionBus.setState("stale", { lastPacket: lastPacketTime });
          }
        }, 5000);
      }
      return () => {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          abortController?.abort();
          connectionBus.setState("disconnected");
        }
      };
    },
    connectionBus,
  };
}
```

### TxLINE Auth Flow Pattern
```typescript
// lib/txline/txLineAuth.ts
// Full auth flow: guest JWT → on-chain subscribe → API token activation

interface TxLineCredentials {
  jwt: string;
  apiToken: string;
}

// Step 1: Get guest JWT
export async function getGuestJwt(): Promise<string> {
  const res = await fetch(`${DEVNET_ORIGIN}/auth/guest/start`, { method: "POST" });
  const data = await res.json();
  return data.token;
}

// Step 2: On-chain subscribe (wallet required)
// This step requires a Solana wallet with @solana/web3.js
// Uses Service Level 1 (free World Cup, 60s delay on devnet)
// See: https://txline.txodds.com/documentation/worldcup

// Step 3: Activate API token
export async function activateApiToken(jwt: string, txSig: string): Promise<string> {
  const res = await fetch(`${DEVNET_ORIGIN}/api/token/activate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      txSig,
      leagues: [],
      // walletSignature required — generated by signing `${txSig}::${jwt}`
    }),
  });
  const data = await res.json();
  return data.token;
}
```

### serwist Turbopack Setup Pattern
```typescript
// app/sw.ts — Service Worker Entry
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      { url: "/~offline", matcher: ({ request }) => request.destination === "document" },
    ],
  },
});

serwist.addEventListeners();
```

```typescript
// app/serwist/route.ts — SW Route Handler (or similar for @serwist/turbopack)
import { createSerwistRoute } from "@serwist/turbopack";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "app/sw.ts",
  useNativeEsbuild: true,
});
```

```tsx
// app/layout.tsx (modified) — Add SerwistProvider + offline URL metadata
// import { SerwistProvider } from "@serwist/turbopack/react"; // Client component
```

### Match Selection Fade Transition Pattern
```tsx
// In page.tsx — appState-based conditional rendering with CSS fade
<div className={`transition-opacity duration-300 ${appState.phase === 'MATCH_SELECT' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
  <MatchSelector onSelect={(id) => dispatch({ type: 'SELECT_MATCH', matchId: id })} />
</div>
<div className={`transition-opacity duration-300 ${appState.phase === 'AR_HUD_LIVE' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
  {/* Camera + HUD layout */}
</div>
```

### Fixture IDs Config (Seeded for Hackathon)
```typescript
// lib/txline/txLineFixtureIds.ts
// World Cup 2026 fixtures from TxLINE schedule (as of 2026-07-09)
export const FIXTURE_IDS = [
  {
    fixtureId: 18209181,
    homeTeam: "France",
    awayTeam: "Morocco",
    competition: "World Cup > Quarter-finals",
    kickoff: "2026-07-09T20:00:00Z", // TODAY!
  },
  {
    fixtureId: 18172489,
    homeTeam: "Brazil",
    awayTeam: "Japan",
    competition: "World Cup > Round of 32",
    kickoff: "2026-06-29T17:00:00Z",
  },
  {
    fixtureId: 18175983,
    homeTeam: "Germany",
    awayTeam: "Paraguay",
    competition: "World Cup > Round of 32",
    kickoff: "2026-06-29T20:30:00Z",
  },
] as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-pwa@5.6.0 (abandoned) | serwist@9.5.11 | Sep 2024 | Active maintenance, Turbopack support, Configurator mode |
| @ducanh2912/next-pwa | serwist (community fork) | 2025 | Fork renamed; serwist is now the canonical upstream |
| Webpack-only SW build | Route Handler approach (bundler-agnostic) | 2026 | `@serwist/turbopack` uses esbuild via Route Handler, no bundler dependency |
| Native EventSource | fetch + SSE parser | N/A | Required for custom auth headers |

**Deprecated/outdated:**
- next-pwa@5.6.0: Abandoned, incompatible with Next.js 16.
- @ducanh2912/next-pwa: Renamed to serwist. Use serwist directly.
- Webpack plugin SW injection for Turbopack projects: `@serwist/turbopack` Route Handler replaces it.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Devnet free tier (Service Level 1) uses 60-second delayed data | Architecture Patterns | If delay is real-time (SL 12), connection patterns unchanged but staleness threshold needs adjustment |
| A2 | TxLINE scores SSE event format has `scoreSoccer` object | Code Examples | The exact score field path in the SSE JSON may differ; adapter must be resilient to field changes |
| A3 | The guest JWT flow doesn't require a wallet on devnet | Code Examples | TxLINE docs show JWT from `/auth/guest/start` is anonymous. If devnet requires wallet auth, the flow gets more complex |
| A4 | The on-chain `subscribe` transaction (free tier) doesn't require TxL tokens | Code Examples | Confirmed by TxLINE docs: "Free tiers require no TxL payment" |

## Open Questions (RESOLVED)

1. **TxODDS data adapter field mapping — discretion area**
   - What we know: TxLINE scores SSE returns `SoccerData` objects with `scoreSoccer` (containing `Participant1.Total.Goals`), `gameState` (NS/H1/HT/H2/F), `clock`, `possession`, `action`, etc. TxLINE odds SSE returns `OddsPayload` with `PriceNames`/`Prices` arrays.
   - What's unclear: Exact field paths in the SSE JSON for scores and odds. The adapter logic is marked as agent's discretion.
   - Recommendation: Use the TxLINE OpenAPI spec (`docs/docs.yaml`) as reference during implementation. Write adapter defensively with Zod validation at boundary.

2. **SSE stream reconnect with stale detection**
   - What we know: D-03 specifies exponential backoff (e.g., 1s, 2s, 4s, 8s max). Stale threshold is 30s per UI-SPEC.
   - What's unclear: Whether to close and reopen both streams on reconnect, or just the failed one. Whether to expose `Last-Event-ID` for resume.
   - Recommendation: Both streams independently reconnect. Don't implement `Last-Event-ID` resume for hackathon — simply re-fetch current state.

3. **serwist update banner integration**
   - What we know: `@serwist/turbopack/react` exports `SerwistProvider` with built-in update detection via `onNeedRefresh` callback.
   - What's unclear: Whether the update banner in SwUpdateNotification should use serwist's native `needRefresh` state or a custom implementation.
   - Recommendation: Use serwist's built-in `useRegisterSW` hook which provides `needRefresh: boolean` and `updateServiceWorker()` function.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + dev | ✓ (check) | — | — |
| npm | Package install | ✓ (check) | — | — |
| Next.js 16 | App framework | ✓ | ^16.2.10 | — |
| Turbopack | Build | ✓ | bundled with Next.js | Webpack fallback |
| serwist | Service Worker | ⚠️ not yet installed | — | Install `serwist @serwist/turbopack` |
| TxLINE Devnet API | SSE data source | ✓ (external) | — | Mock fallback (existing) |
| Solana wallet | TxLINE on-chain subscribe | ✓ (from Phase 3b) | — | Skip activate, use mock |

**Missing dependencies with no fallback:** None — all deps are installable.
**Missing dependencies with fallback:** TxLINE API — if unreachable, app falls back to API_ERROR/offline state (new behavior in this phase).

## Validation Architecture

> This phase adds real-time external data and service worker behavior. Validation must cover connection states, error paths, offline behavior, and the data adapter mapping.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest v2 |
| Config file | vitest.config.ts (exists from Phase 1) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIVE-01 | TxLineSseSource adapter maps TxODDS scores event → TxLineEventPacket | unit | `npx vitest run lib/txline/txLineSseAdapter.test.ts` | ❌ Wave 0 |
| LIVE-01 | TxLineSseSource adapter maps TxODDS odds event → TxLineEventPacket | unit | `npx vitest run lib/txline/txLineSseAdapter.test.ts` | ❌ Wave 0 |
| LIVE-01 | Adapter merges scores + odds into single packet | unit | Same as above | ❌ Wave 0 |
| LIVE-01 | Zod validation passes for adapted data | unit | Same as above | ❌ Wave 0 |
| LIVE-02 | MatchSelector renders fixture list from config | unit | `npx vitest run app/components/MatchSelector.test.tsx` | ❌ Wave 0 |
| LIVE-02 | Tapping match dispatches SELECT_MATCH | unit | Same as above | ❌ Wave 0 |
| LIVE-03 | Connection state transitions (connecting→connected→disconnected) | unit | `npx vitest run lib/txline/txLineConnectionBus.test.ts` | ❌ Wave 0 |
| LIVE-03 | SSE exponential backoff retries | unit | `npx vitest run lib/txline/txLineSseSource.test.ts` | ❌ Wave 0 |
| LIVE-03 | Stale detection (>30s since last packet) | unit | Same as above | ❌ Wave 0 |
| OFFL-01 | Service worker registers on page load | e2e/manual | `npx playwright test tests/e2e/pwa.spec.ts` (manual) | ❌ Wave 0 |
| OFFL-01 | Precached assets available offline | e2e/manual | Go offline in DevTools, verify page loads | ❌ Wave 0 |
| OFFL-02 | Offline page shows on navigation when offline | e2e/manual | Navigate offline, verify `/~offline` shell | ❌ Wave 0 |
| LIVE-01..03 | App state machine transitions correctly | unit | `npx vitest run lib/txline/txLineAppMachine.test.ts` | ❌ Wave 0 |
| LIVE-01..03 | Connection status hook returns expected states | unit | `npx vitest run lib/txline/useConnectionStatus.test.ts` | ❌ Wave 0 |
| LIVE-01..03 | ApiStatusIndicator renders per connection state | unit | `npx vitest run app/components/ApiStatusIndicator.test.tsx` | ❌ Wave 0 |
| LIVE-01..03 | DataErrorBanner renders on API_ERROR state | unit | `npx vitest run app/components/DataErrorBanner.test.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run lib/txline/ --reporter=verbose` (data layer tests only)
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green + manual offline test before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `lib/txline/txLineSseAdapter.test.ts` — covers LIVE-01 adapter mapping
- [ ] `lib/txline/txLineConnectionBus.test.ts` — covers LIVE-03 connection states
- [ ] `lib/txline/txLineSseSource.test.ts` — covers LIVE-03 retry/stale logic
- [ ] `lib/txline/txLineAppMachine.test.ts` — covers app state machine transitions
- [ ] `lib/txline/useConnectionStatus.test.ts` — covers connection hook
- [ ] `app/components/MatchSelector.test.tsx` — covers LIVE-02 match selection
- [ ] `app/components/ApiStatusIndicator.test.tsx` — covers status indicator
- [ ] `app/components/DataErrorBanner.test.tsx` — covers error banner
- [ ] `tests/e2e/pwa.spec.ts` — covers OFFL-01/02 offline behavior (manual/e2e)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Guest JWT from `/auth/guest/start` — no user auth needed. JWT handled in-memory only, never stored. |
| V5 Input Validation | yes | Zod schema at data boundary (`txLineEventPacketSchema`) validates all SSE data before dispatch to widgets. |
| V6 Cryptography | no | No custom crypto. TxLINE handles on-chain proofs. |
| V8 Communications | yes | TxLINE API uses HTTPS. SSE over `apiOrigin` (https://txline-dev.txodds.com). |

### Known Threat Patterns for Next.js + SSE

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JWT leakage via SW cache | Information Disclosure | Do NOT cache JWT or API token in SW. Precached pages re-auth on each session. |
| SSE injection via malicious data | Tampering | Zod validation at adapter boundary rejects malformed packets before they reach React state. |
| Exposed API token in client bundle | Information Disclosure | JWT/API token obtained at runtime from TxLINE API, never bundled as a build-time constant. |

## Sources

### Primary (HIGH confidence)
- [CITED: https://txline.txodds.com/documentation/examples/streaming-data] — SSE streaming pattern, `readSseMessages` parser, auth headers
- [CITED: https://txline.txodds.com/documentation/quickstart] — Full auth flow: JWT → subscribe → activate
- [CITED: https://txline.txodds.com/documentation/worldcup] — World Cup free tier details, devnet config
- [CITED: https://txline.txodds.com/documentation/scores/schedule] — Fixture schedule with real fixture IDs
- [CITED: https://txline.txodds.com/api-reference/scores] — Scores schema (`SoccerData`, `SoccerFixtureScore`, etc.)
- [CITED: https://txline.txodds.com/api-reference/odds] — Odds schema (`OddsPayload`)
- [CITED: https://serwist.pages.dev/docs/next/turbo] — `@serwist/turbopack` setup guide
- [VERIFIED: npm registry] — `@serwist/turbopack@9.5.11` exists, latest stable

### Secondary (MEDIUM confidence)
- [CITED: https://shinyaz.com/en/blog/2026/02/24/serwist-turbopack-migration] — Real-world Turbopack migration experience
- [CITED: https://txline.txodds.com/documentation/scores/soccer-feed] — Soccer game phase encoding

### Tertiary (LOW confidence)
- [ASSUMED] — Exact data field paths in SSE JSON for scores/odds events (adapter details in agent's discretion)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — serwist version verified on npm, TxLINE docs verified
- Architecture: HIGH — all patterns verified against official TxLINE and serwist docs
- Pitfalls: HIGH — EventSource header limitation confirmed by TxLINE docs; Turbopack compatibility confirmed

**Research date:** 2026-07-09
**Valid until:** 2026-08-09 (30 days — serwist, TxLINE API stable)
