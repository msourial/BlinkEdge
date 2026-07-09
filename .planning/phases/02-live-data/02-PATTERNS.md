# Phase 02: Live Data — Pattern Map

**Mapped:** 2026-07-09
**Files to create:** 15
**Files to modify:** 4
**Analogs found:** 15 / 19

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/txline/txLineSseSource.ts` | service | streaming/event-driven | `lib/txline/mockData.ts` `createMockTxLineSource()` | exact — same interface |
| `lib/txline/txLineSseAdapter.ts` | utility | transform | `lib/txline/mockData.ts` `generatePacket()` | role-match |
| `lib/txline/txLineFixtureIds.ts` | config | static | — | no analog (new file type) |
| `lib/txline/txLineAuth.ts` | service | request-response | `lib/risk/riskEngine.ts` `evaluate()` | role-match |
| `lib/txline/txLineConnectionBus.ts` | utility | event-driven | `lib/txline/mockData.ts` subscriber set pattern | role-match |
| `lib/txline/useConnectionStatus.ts` | hook | event-driven | `lib/txline/TxLineProvider.tsx` `useTxLine()` | exact — same context pattern |
| `lib/txline/txLineAppMachine.ts` | utility | state | `app/components/CameraBackdrop.tsx` camera state enum | role-match |
| `app/components/MatchSelector.tsx` | component | request-response | `app/components/CameraBackdrop.tsx` multi-state UI | role-match |
| `app/components/MatchCard.tsx` | component | request-response | `app/components/OddsMatrix.tsx` card button pattern | exact |
| `app/components/ApiStatusIndicator.tsx` | component | request-response | existing HUD widgets (Scoreboard, OddsMatrix) | role-match |
| `app/components/DataErrorBanner.tsx` | component | request-response | `app/components/CameraBackdrop.tsx` overlay pattern | role-match |
| `app/components/SwUpdateNotification.tsx` | component | request-response | — | no analog (new concern) |
| `app/sw.ts` | utility | static | — | no analog (new file type) |
| `app/~offline/page.tsx` | component | static | existing `app/page.tsx` layout pattern | role-match |
| `app/serwist/route.ts` | route | static | — | no analog (new file type) |
| **MODIFIED:** `lib/txline/TxLineProvider.tsx` | provider | event-driven | `lib/risk/RiskEngineProvider.tsx` | exact — same context provider pattern |
| **MODIFIED:** `app/page.tsx` | page | request-response | existing `app/page.tsx` | self |
| **MODIFIED:** `app/layout.tsx` | layout | static | existing `app/layout.tsx` | self |
| **MODIFIED:** `next.config.mjs` | config | static | existing `next.config.mjs` | self |

## Pattern Assignments

### `lib/txline/txLineSseSource.ts` (service, streaming/event-driven)

**Analog:** `lib/txline/mockData.ts` — both implement `TxLineSource` with subscriber set and callback dispatch

**Imports pattern** (mockData.ts lines 1-2):
```typescript
import type { TxLineEventPacket, TxLineEvent } from "@/lib/schema/txLineSchema";
import type { TxLineSource } from "./TxLineSource";
```

**Subscriber management pattern** (mockData.ts lines 99-108):
```typescript
const subscribers = new Set<(packet: TxLineEventPacket) => void>();

// Dispatch to all subscribers
subscribers.forEach((cb) => cb(packet));
```

**Subscribe/unsubscribe return pattern** (mockData.ts lines 112-127):
```typescript
subscribe(callback: (packet: TxLineEventPacket) => void): () => void {
  subscribers.add(callback);
  if (interval === null) {
    tick();
    interval = setInterval(tick, 2000);
  }
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  };
},
```

**Return type** (mockData.ts line 112) — must return `TxLineSource`:
```typescript
export function createMockTxLineSource(): TxLineSource {
```

**For SSE variant: replace `setInterval` with `fetch` + `readSseMessages` async generator loop.** Keep the subscriber set pattern identical. The `createTxLineSseSource()` should also return `connectionBus` on the same object (non-interface property):

```typescript
// RESEARCH.md lines 438-439 — return shape
export function createTxLineSseSource(config: SseSourceConfig): TxLineSource & { connectionBus: ConnectionEventBus } {
```

**Zod validation at boundary** (from txLineSchema.test.ts lines 44-46):
```typescript
import { txLineEventPacketSchema } from "@/lib/schema/txLineSchema";
// Validate packet before dispatching:
const parsed = txLineEventPacketSchema.parse(mergedState);
```

---

### `lib/txline/txLineSseAdapter.ts` (utility, transform)

**Analog:** `lib/txline/mockData.ts` `generatePacket()` function — same role: transforms input data into `TxLineEventPacket`

**Analog file:** `lib/schema/txLineSchema.ts` — the target schema/type

**Return type pattern** (mockData.ts line 76):
```typescript
return {
  matchId: MATCH_ID,
  timestamp: Date.now(),
  minute,
  score,
  possession: { home: possessionHome, away: 100 - possessionHome },
  events,
  oddsSnapshot: { home: ..., draw: ..., away: ... },
  consensus: { direction: ..., confidence: ... },
};
```

**Validation pattern** (txLineSchema.test.ts lines 44-46):
```typescript
// Adapter should parse raw TxODDS data at boundary:
import { txLineEventPacketSchema } from "@/lib/schema/txLineSchema";
```

**Recommended signature:**
```typescript
export function parseScoreEvent(data: unknown): Partial<TxLineEventPacket> { ... }
export function parseOddsEvent(data: unknown): Partial<TxLineEventPacket> { ... }
export function mergeScoresAndOdds(scores: Partial<TxLineEventPacket>, odds: Partial<TxLineEventPacket>): TxLineEventPacket { ... }
```

---

### `lib/txline/txLineFixtureIds.ts` (config, static)

**No direct analog in codebase.** The project has no standalone config files yet.

**Pattern:** Simple `as const` export — copy the fixture ID shape from RESEARCH.md lines 617-641:
```typescript
export const FIXTURE_IDS = [
  {
    fixtureId: 18209181,
    homeTeam: "France",
    awayTeam: "Morocco",
    competition: "World Cup > Quarter-finals",
    kickoff: "2026-07-09T20:00:00Z",
  },
  // ... 2-3 entries total
] as const;
```

**Also export API endpoints:**
```typescript
export const DEVNET_ORIGIN = "https://txline-dev.txodds.com";
export const SSE_SCORES_PATH = "/api/scores/stream";
export const SSE_ODDS_PATH = "/api/odds/stream";
export const AUTH_PATH = "/auth/guest/start";
export const ACTIVATE_PATH = "/api/token/activate";
export const STALE_THRESHOLD_MS = 30_000;
export const MAX_RETRIES = 5;
```

---

### `lib/txline/txLineAuth.ts` (service, request-response)

**Analog:** `lib/risk/riskEngine.ts` — same service layer role (this file was already read; pattern is exported async functions)

**Analog file:** `lib/risk/riskEngine.ts` (serves as service module pattern - pure functions, exported individually).

**Recommended structure — pure functions, no classes:**
```typescript
// lib/txline/txLineAuth.ts
import { DEVNET_ORIGIN, AUTH_PATH, ACTIVATE_PATH } from "./txLineFixtureIds";

export async function getGuestJwt(): Promise<string> {
  const res = await fetch(`${DEVNET_ORIGIN}${AUTH_PATH}`, { method: "POST" });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

export async function activateApiToken(jwt: string, txSig: string): Promise<string> {
  const res = await fetch(`${DEVNET_ORIGIN}${ACTIVATE_PATH}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ txSig, leagues: [] }),
  });
  if (!res.ok) throw new Error(`Token activation failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}
```

---

### `lib/txline/txLineConnectionBus.ts` (utility, event-driven)

**Analog:** `lib/txline/mockData.ts` subscriber set pattern — same `Set<callback>` + subscribe returns `() => void`

**Subscriber set pattern** (mockData.ts lines 99, 108, 113-126):
```typescript
const subscribers = new Set<(packet: TxLineEventPacket) => void>();

// Dispatch
subscribers.forEach((cb) => cb(packet));

// Subscribe returns unsubscribe
subscribe(listener): () => void {
  this.listeners.add(listener);
  return () => this.listeners.delete(listener);
}
```

**Recommended implementation per RESEARCH.md lines 296-316:**
```typescript
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

---

### `lib/txline/useConnectionStatus.ts` (hook, event-driven)

**Analog:** `lib/txline/TxLineProvider.tsx` `useTxLine()` — exact same React Context + hook pattern

**Context + hook pattern** (TxLineProvider.tsx lines 8-23):
```typescript
"use client";

import { createContext, useContext, type ReactNode } from "react";

const ConnectionStatusContext = createContext<ConnectionState>("disconnected");

// Provider wraps children
export function ConnectionStatusProvider({ children, connectionBus }: { children: ReactNode; connectionBus: ConnectionEventBus }) {
  const [state, setState] = useState<ConnectionState>("disconnected");
  
  useEffect(() => {
    return connectionBus.subscribe((newState) => setState(newState));
  }, [connectionBus]);

  return (
    <ConnectionStatusContext.Provider value={state}>
      {children}
    </ConnectionStatusContext.Provider>
  );
}

export function useConnectionStatus(): ConnectionState {
  return useContext(ConnectionStatusContext);
}
```

**Important:** Hook name follows the existing `useTxLine()` naming convention (camelCase, no `_` separator).

---

### `lib/txline/txLineAppMachine.ts` (utility, state)

**Analog:** `app/components/CameraBackdrop.tsx` camera state enum pattern — same useReducer-like state machine

**State enum pattern** (CameraBackdrop.tsx line 6):
```typescript
type CameraState = "idle" | "requesting" | "granted" | "denied" | "error" | "skipped" | "reconnecting" | "unsupported";
```

**Recommended AppState type** (RESEARCH.md lines 324-338):
```typescript
export type AppState =
  | { phase: "LOADING" }
  | { phase: "MATCH_SELECT" }
  | { phase: "CAMERA_INIT"; selectedMatchId: number }
  | { phase: "AR_HUD_LIVE"; selectedMatchId: number }
  | { phase: "OFFLINE" }
  | { phase: "API_ERROR"; error: string };
```

**Reducer pattern** (RESEARCH.md lines 341-370):
```typescript
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

---

### `app/components/MatchSelector.tsx` (component, request-response)

**Analog:** `app/components/CameraBackdrop.tsx` — same multi-state UI rendering pattern with overlay/backdrop and conditional sections

**'use client' pattern** (CameraBackdrop.tsx line 1, all component files):
```typescript
"use client";
```

**State-based conditional rendering** (CameraBackdrop.tsx lines 88-122):
```typescript
if (state === "granted") {
  return ( /* camera view */ );
}
// fall through to gate UI
```

**MatchSelector should render:**
- Scrollable match list (`overflow-y-auto` with `contain: layout paint`)
- Skeleton cards during loading (use `animate-pulse` per UI-SPEC)
- Empty state centered card: "No Live Matches" + body text
- Error state: "Connection Lost" + "Retry" button
- Uses `appStateDispatch({ type: 'SELECT_MATCH', matchId })` on tap

**Fade transition wrapper pattern** (RESEARCH.md lines 605-611):
```tsx
<div className={`transition-opacity duration-300 ${appState.phase === 'MATCH_SELECT' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
  <MatchSelector onSelect={(id) => dispatch({ type: 'SELECT_MATCH', matchId: id })} />
</div>
```

---

### `app/components/MatchCard.tsx` (component, request-response)

**Analog:** `app/components/OddsMatrix.tsx` — clickable card with active state, uses the same accent color styling

**Card button pattern** (OddsMatrix.tsx lines 31-45):
```tsx
<button
  onClick={() => onSelectBet(item.label)}
  className={
    "flex-1 rounded-xl px-2 py-2 text-center transition-all duration-200 cursor-pointer " +
    (isActive
      ? "bg-cyan-500/20 border border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
      : "bg-white/5 hover:bg-white/10 border border-transparent")
  }
>
  <div className="text-[10px] font-mono text-slate-500">{item.label}</div>
  <div className="font-mono text-xs font-semibold text-slate-200">{item.value}</div>
</button>
```

**Typography pattern per UI-SPEC:**
- Team name: 14px weight 600 (semibold), `font-sans`
- Score: 24px weight 600 (semibold), `font-mono` — use `text-2xl font-bold font-mono text-slate-200` (copy from Scoreboard.tsx)
- Time/status: 12px weight 400, `text-xs text-slate-500 font-mono`

**Card container pattern** (Scoreboard.tsx line 13):
```tsx
<div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
```

---

### `app/components/ApiStatusIndicator.tsx` (component, request-response)

**Analog:** Existing HUD widget components (`Scoreboard.tsx`, `ConsensusIndicator.tsx`) — same minimal presentational component that reads from a hook

**Component structure** (Scoreboard.tsx lines 1-14):
```typescript
"use client";

import { useConnectionStatus } from "@/lib/txline/useConnectionStatus";

export function ApiStatusIndicator() {
  const status = useConnectionStatus();
  // ... render dot + label based on status
}
```

**Status dot visual per UI-SPEC section "State: API Connection":**
- 8px diameter circle (`w-2 h-2 rounded-full`)
- `connecting`: `bg-amber-400` with `animate-pulse`
- `connected`: `bg-cyan-400` with `shadow-[0_0_8px_rgba(0,240,255,0.5)]`
- `reconnecting`: `bg-amber-400` with `animate-pulse` and `shadow-[0_0_12px_rgba(255,184,0,0.5)]`
- `disconnected`: `bg-magenta-500` (neon `#ff00e5`) with `shadow-[0_0_8px_rgba(255,0,229,0.5)]`
- `stale`: `bg-amber-400` with slower pulse

**Label text per UI-SPEC copywriting contract:**
- connected → "Connected"
- connecting → "Connecting…"
- reconnecting → "Reconnecting…"
- disconnected → "Disconnected"
- stale → "Stale Data"

---

### `app/components/DataErrorBanner.tsx` (component, request-response)

**Analog:** `app/components/CameraBackdrop.tsx` — overlay pattern with translucent background

**Overlay pattern** (CameraBackdrop.tsx lines 104-116):
```tsx
// Translucent overlay centered content
<div className="relative min-h-screen w-full flex flex-col items-center justify-center">
  <div className="flex flex-col items-center text-center">
    <p className="font-mono text-sm" style={{ color: "var(--color-amber)" }}>
      Connecting…
    </p>
  </div>
</div>
```

**Recommended banner overlay per UI-SPEC:**
- Positioned `fixed bottom-0 inset-x-0` (banner at bottom, not full overlay)
- Amber background: `rgba(255, 184, 0, 0.12)` with amber border
- Heading: "Connection Lost" (text-xl weight 600 mono)
- Body: "Can't reach TxODDS data. Check your connection and try again." (text-sm weight 400)
- "Retry" button calls `dispatch({ type: "RETRY" })`
- For stale state: heading "Stale Data" + last-updated timestamp

---

### `app/components/SwUpdateNotification.tsx` (component, request-response)

**No direct analog.** New component type for service worker update detection.

**Pattern:** Use serwist's built-in `useRegisterSW` hook per RESEARCH.md lines 680-681:
```typescript
import { useRegisterSW } from "@serwist/turbopack/react";
```

**In component:**
```typescript
function SwUpdateNotification() {
  const { needRefresh, updateServiceWorker } = useRegisterSW();
  
  if (!needRefresh) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-cyan-500/10 border-b border-cyan-400 p-4 backdrop-blur-xl">
      <p className="font-mono text-sm text-cyan-200">New Update Available</p>
      <button onClick={updateServiceWorker} className="...">
        Refresh Now
      </button>
    </div>
  );
}
```

---

### **MODIFIED:** `lib/txline/TxLineProvider.tsx` (provider, event-driven)

**Analog:** `lib/risk/RiskEngineProvider.tsx` — exact same pattern: reads from another context, processes packets with useEffect, provides via context

**Provider composition pattern** (RiskEngineProvider.tsx lines 1-40):
```typescript
"use client";

import { createContext, useContext, useEffect, useState, useReducer, type ReactNode } from "react";
import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";
import { useTxLine } from "./TxLineProvider";  // still the existing hook
import { createTxLineSseSource } from "./txLineSseSource";
import { ConnectionEventBus } from "./txLineConnectionBus";

interface TxLineContextValue {
  packet: TxLineEventPacket | null;
  connectionBus: ConnectionEventBus;
}

const TxLineContext = createContext<TxLineContextValue>(null!);

export function TxLineProvider({ children }: { children: ReactNode }) {
  const [packet, setPacket] = useState<TxLineEventPacket | null>(null);
  const [connectionBus] = useState(() => new ConnectionEventBus());

  useEffect(() => {
    // Swap mock for real SSE source
    const source = createTxLineSseSource({
      jwt: "...",
      apiToken: "...",
      fixtureId: 18209181,
      onConnectionChange: (state, meta) => connectionBus.setState(state, meta),
    });
    const unsubscribe = source.subscribe((p) => setPacket(p));
    return unsubscribe;
  }, [connectionBus]);

  return (
    <TxLineContext.Provider value={{ packet, connectionBus }}>
      {children}
    </TxLineContext.Provider>
  );
}

export function useTxLine(): TxLineEventPacket | null {
  const ctx = useContext(TxLineContext);
  return ctx?.packet ?? null;
}

export function useConnectionBus(): ConnectionEventBus {
  const ctx = useContext(TxLineContext);
  return ctx.connectionBus;
}
```

---

### **MODIFIED:** `app/page.tsx` (page, request-response)

**Analog:** existing `app/page.tsx` — self-referential, extend the current pattern

**Current pattern** (page.tsx lines 1-95):
- `"use client"` directive
- `useState` for camera active state
- Vendor providers wrapping children: `<TxLineProvider><RiskEngineProvider><WalletProvider>` (lines 38-40)
- CSS phone frame `max-w-[400px] h-[800px]` (line 44)
- Camera `<video>` element (line 47)
- Conditional overlay: `{!isCameraActive && ( ... )}` for pre-camera state (line 50)
- Top HUD: Scoreboard (line 70)
- Bottom drawer: ConsensusIndicator + OddsMatrix (lines 74-80)

**Additions this phase:**
- Replace `isCameraActive` boolean with `appState` reducer (import `appStateReducer`, `useReducer`)
- Add `onSelectMatch` callback passed to `<MatchSelector>`
- Add `<ConnectionStatusProvider>` wrapping
- Add `<ApiStatusIndicator>` in top-right of HUD
- Add `<DataErrorBanner>` when in API_ERROR or AR_HUD_LIVE+disconnected/stale
- Add `<SwUpdateNotification>` for SW updates
- Fade transitions: two nested divs with `transition-opacity duration-300` (one for match list, one for camera+HUD)

**Dispatch integration point** (current line 50):
```tsx
// Replace: {!isCameraActive && (
// With:
{appState.phase === 'MATCH_SELECT' && (
  <MatchSelector onSelect={(id) => dispatch({ type: 'SELECT_MATCH', matchId: id })} />
)}
{appState.phase === 'AR_HUD_LIVE' && (
  // Camera + HUD layout (existing code)
)}
```

---

### `app/sw.ts` (utility, static)

**No direct analog.** Use the serwist pattern from RESEARCH.md lines 558-586.

**Take the code as provided:**
```typescript
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

---

### `app/serwist/route.ts` (route, static)

**No direct analog.** Use `@serwist/turbopack` Route Handler pattern per RESEARCH.md lines 589-596:

```typescript
import { createSerwistRoute } from "@serwist/turbopack";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "app/sw.ts",
  useNativeEsbuild: true,
});
```

---

### **MODIFIED:** `app/layout.tsx` (layout, static)

**Add:** `SerwistProvider` from `@serwist/turbopack/react`

Add after existing imports (layout.tsx lines 1-3):
```typescript
import { SerwistProvider } from "@serwist/turbopack/react";
```

Wrap body children (layout.tsx line 43):
```tsx
<body className="bg-canvas text-ink antialiased font-sans">
  <SerwistProvider>{children}</SerwistProvider>
</body>
```

---

### **MODIFIED:** `next.config.mjs` (config, static)

**Add serwist config** (next.config.mjs, around line 6):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
```

No structural change needed for serwist — `@serwist/turbopack` uses a Route Handler approach and doesn't require next.config modifications beyond what's already there.

---

## Shared Patterns

### React Context Provider Pattern
**Source:** `lib/txline/TxLineProvider.tsx` and `lib/risk/RiskEngineProvider.tsx`
**Apply to:** `TxLineProvider.tsx` (modified), `useConnectionStatus.ts`
```typescript
"use client";
import { createContext, useContext, type ReactNode } from "react";

const MyContext = createContext<MyType>(null!);

export function MyProvider({ children }: { children: ReactNode }) {
  // ... state, effects
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

export function useMyHook(): MyType {
  return useContext(MyContext);
}
```

### 'use client' Directive
**Source:** All interactive components
**Apply to:** All new components (MatchSelector, MatchCard, ApiStatusIndicator, DataErrorBanner, SwUpdateNotification)
```typescript
"use client";
```
Always first line of any component file.

### HUD Widget Card Container
**Source:** `app/components/Scoreboard.tsx`, `OddsMatrix.tsx`, `ConsensusIndicator.tsx`
**Apply to:** `MatchCard.tsx`, `ApiStatusIndicator.tsx`
```tsx
<div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
```

### Vitest Test Structure
**Source:** `lib/txline/mockData.test.ts`, `lib/schema/txLineSchema.test.ts`, `lib/risk/riskEngine.test.ts`
**Apply to:** All test files for Phase 2
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { thingToTest } from "./module";
import { txLineEventPacketSchema } from "@/lib/schema/txLineSchema";

describe("ModuleName", () => {
  it("does something specific", () => {
    // Arrange
    // Act
    // Assert
    expect(result).toEqual(expected);
  });
});
```

**Schema validation tests** (txLineSchema.test.ts lines 44-47):
```typescript
it("validates a well-formed packet", () => {
  expect(() => txLineEventPacketSchema.parse(validPacket)).not.toThrow();
});
```

**Fake timers for async/interval tests** (mockData.test.ts lines 9-14):
```typescript
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });
```

**Collect helper for subscription testing** (mockData.test.ts lines 16-26):
```typescript
function collect(source: ReturnType<typeof createMockTxLineSource>, count: number): Promise<TxLineEventPacket[]> {
  return new Promise((resolve) => {
    const collected: TxLineEventPacket[] = [];
    source.subscribe((packet) => {
      collected.push(packet);
      if (collected.length === count) resolve(collected);
    });
  });
}
```

### TypeScript Path Aliases
**Source:** All existing imports
**Apply to:** All files
```typescript
import { ... } from "@/lib/schema/txLineSchema";  // @/ resolves to src/ or root
import { ... } from "./TxLineSource";  // relative for co-located files
```

### Accordion/Overlay CSS (Tailwind v4)
**Source:** All HUD widgets use inline Tailwind classes
**Apply to:** All new components
```tsx
// Card shadow for HUD widgets
className="shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
// Cyan glow for active states
className="shadow-[0_0_12px_rgba(34,211,238,0.25)]"
// Backdrop blur for translucent HUD
className="backdrop-blur-xl"
```

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `lib/txline/txLineFixtureIds.ts` | config | static | Project has no standalone config files |
| `app/components/SwUpdateNotification.tsx` | component | request-response | No service worker components exist |
| `app/sw.ts` | utility | static | No service worker entry exists |
| `app/serwist/route.ts` | route | static | No SW route handler exists |

For these 4 files, the RESEARCH.md patterns and code examples from the research phase should be used directly as the implementation blueprint.

## Metadata

**Analog search scope:** `app/components/`, `lib/txline/`, `lib/risk/`, `lib/schema/`, `app/`
**Files scanned:** 22
**Pattern extraction date:** 2026-07-09
