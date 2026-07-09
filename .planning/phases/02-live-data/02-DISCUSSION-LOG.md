# Phase 02: Live Data — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-09
**Phase:** 02-live-data
**Areas discussed:** TxODDS Wire Protocol, Live Data State Management, Match Selection Routing, Service Worker Strategy

---

## TxODDS Wire Protocol

| Option | Description | Selected |
|--------|-------------|----------|
| SSE | Server-Sent Events — TxLINE native, matches TxLineSource subscribe pattern | ✓ (via "You decide") |
| WebSocket | Bidirectional, lower latency, heavier reconnection | |
| REST Polling | Simple HTTP GET on interval, wastes bandwidth | |
| You decide | Agent researched TxLINE docs → SSE is native protocol | ✓ |

**Follow-up: Auth approach**
| Option | Description | Selected |
|--------|-------------|----------|
| Full on-chain flow | Guest JWT + on-chain subscribe + off-chain activate. Full Solana integration | |
| Devnet shortcut | Devnet wallet, devnet API, on-chain subscribe (free World Cup tier) | ✓ |
| Hardcoded guest JWT | Pre-fetch guest JWT, skip on-chain subscribe entirely | |

**Follow-up: SSE lifecycle**
| Option | Description | Selected |
|--------|-------------|----------|
| EventSource with manual retry | Native EventSource + custom exponential backoff | ✓ |
| RxJS or custom SSE lib | Observable patterns, heavier but more robust | |

**Follow-up: Data channels**
| Option | Description | Selected |
|--------|-------------|----------|
| Scores + Odds | Both SSE streams, full HUD live data | ✓ |
| Scores only | Scores stream only, odds/consensus stay mock | |

**Follow-up: Data mapping**
| Option | Description | Selected |
|--------|-------------|----------|
| Data adapter layer | TxLineSseSource + mapper function, clean separation | ✓ |
| Inline in TxLineProvider | Fetch and transform directly in provider | |

**User's choice:** "You decide" for transport → Agent researched → SSE. Full chain: Devnet → SSE → EventSource + manual retry → Scores+Odds → adapter layer.
**Notes:** The TxLINE documentation confirms native SSE support. Devnet approach chosen for good Solana integration demo without production costs.

---

## Live Data State Management

| Option | Description | Selected |
|--------|-------------|----------|
| React Context + useReducer | Extend TxLineProvider, no new deps | ✓ |
| Zustand store | Dedicated store, more testable, +~1KB dep | |
| useState only | Multiple useStates, simplest but harder to manage | |

**Follow-up: App state machine**
| Option | Description | Selected |
|--------|-------------|----------|
| Separate state machine reducer | Dedicated appState reducer, decoupled from data | ✓ |
| XState machine | Formal state machine with xstate, +~15KB | |
| Inline in page.tsx | Simple useState for appState in page.tsx | |

**Follow-up: Connection status exposure**
| Option | Description | Selected |
|--------|-------------|----------|
| React Context wrapping the bus | Event emitter internally, Context for React components | ✓ |
| Direct EventSource access | Components subscribe directly to EventSource | |
| Custom hook over emitter | mitt/nanoevents + useSyncExternalStore | |

**User's choice:** React Context + useReducer for data layer, separate useReducer for app state machine, event bus wrapped in Context for connection status.
**Notes:** Event bus handles complex lifecycle internally, Context makes it React-friendly. Clean separation between data layer, app state, and connection status.

---

## Match Selection Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Inline state toggle | AppState reducer switches MATCH_SELECT / AR_HUD_LIVE in page.tsx | ✓ |
| Separate route | /matches and /hud/[fixtureId], proper URL state | |
| Overlay/drawer | Slide-up drawer within current page.tsx | |

**Follow-up: Transition**
| Option | Description | Selected |
|--------|-------------|----------|
| Instant swap | No animation, immediate state change | |
| Fade transition | ~300ms fade between screens | ✓ |
| Scale-down to scale-up | Dramatic CSS animation, more complex | |

**Follow-up: Match data source**
| Option | Description | Selected |
|--------|-------------|----------|
| SSE fixture list event | Subscribe to fixture stream, single source of truth | |
| Dedicated REST fetch | GET /api/fixtures on mount, cache with SWR | |
| Manually seeded from config | Hardcode 2-3 World Cup fixture IDs | ✓ |

**User's choice:** Inline toggle in page.tsx, fade transition, manually seeded fixture IDs.
**Notes:** Hackathon demo pragmatism — hardcoded fixture IDs avoid needing fixture list REST endpoint + JWT/auth chain for initial match display.

---

## Service Worker Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| @ducanh2912/next-pwa | Requirement-specified, works with App Router | |
| serwist | Actively maintained fork, same API surface | ✓ |
| Custom service worker | Manual workbox-webpack-plugin or raw SW | |

**Follow-up: Offline strategy**
| Option | Description | Selected |
|--------|-------------|----------|
| Match list only | Cache match list screen only | |
| Full offline shell | Cache both match list and HUD layout | ✓ |
| Skeleton + fallback | Cache only app shell, show skeleton UI | |

**Follow-up: SW update UX**
| Option | Description | Selected |
|--------|-------------|----------|
| Auto-update on next load | New SW activates on next page load | |
| Update banner with refresh | "New Update Available" + "Refresh Now" per UI-SPEC | ✓ |
| Silent background update | Background install, refresh only if idle | |

**User's choice:** serwist, full offline shell, update banner with Refresh Now.
**Notes:** serwist chosen over @ducanh2912 for active maintenance. Full offline shell matches the UI-SPEC SwUpdateNotification component. Update banner UX already defined in UI-SPEC copywriting contract.

---

## Agent's Discretion

- Transport protocol (SSE) — user deferred to agent, researched TxLINE docs
- Exact SSE event format mapping details
- Retry backoff schedule (1s, 2s, 4s, 8s max)
- Connection status dot colors (already defined in UI-SPEC visual contract)
- Fade transition CSS implementation details

## Deferred Ideas

None — discussion stayed within phase scope.
