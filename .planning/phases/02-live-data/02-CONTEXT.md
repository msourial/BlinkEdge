# Phase 02: Live Data — Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace `mockData.ts` with the real TxODDS TxLINE-on-Solana data stream via SSE. Add a manual match selection flow (pre-camera screen with match list), API connection status indicator, error/offline handling, and a service worker for offline shell. The existing TxLineSource interface and HUD widget layout from Phase 1 are the integration points — no visual changes to existing widgets.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**~12 requirements are locked.** See `02-UI-SPEC.md` for full requirements, boundaries, and acceptance criteria covering MatchSelector, ApiStatusIndicator, DataErrorBanner, SwUpdateNotification, the app state machine, connection states, copywriting, and visual contracts.

Downstream agents MUST read `02-UI-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope:** Match selection screen, camera + live HUD, error/offline overlay, service worker offline shell, copywriting per UI-SPEC contracts.

**Out of scope:** Hedge flow (Phase 03b), risk engine (Phase 03b), real SPL hedge (Phase 04), broadcast CV recognition.

</spec_lock>

<decisions>
## Implementation Decisions

### TxODDS Wire Protocol
- **D-01:** Use SSE (Server-Sent Events) — TxLINE natively supports SSE for live data streaming. Fits the existing `TxLineSource` subscribe/callback pattern.
- **D-02:** Use Devnet shortcut — devnet wallet (`txline-dev.txodds.com`), on-chain `subscribe` via free World Cup tier, off-chain `POST /api/token/activate` to get API token. Balances Solana integration (judge-facing) with dev simplicity.
- **D-03:** Use native `EventSource` API with manual retry (exponential backoff) — no additional dependencies. Handle reconnection, stale detection, and max retries.
- **D-04:** Subscribe to both scores and odds SSE streams — populates all HUD widgets (Scoreboard, OddsMatrix, ConsensusIndicator) with live data.
- **D-05:** Create a `TxLineSseSource` that implements `TxLineSource` interface + data adapter/mapper function that transforms TxODDS wire format into `TxLineEventPacket`. Clean decoupling from existing schema.

### Live Data State Management
- **D-06:** Extend existing `TxLineProvider` with `useReducer` for the data packet and connection metadata — no new state management dependencies.
- **D-07:** Separate `useReducer` for app-level state machine (`LOADING → MATCH_SELECT → CAMERA_INIT → AR_HUD_LIVE / OFFLINE / API_ERROR`) — decoupled from data layer, defined in a dedicated hook/reducer file.
- **D-08:** Connection status (5 states: connecting, connected, reconnecting, disconnected, stale) managed via an internal event emitter bus, wrapped in a React Context and exposed via `useConnectionStatus()` hook.

### Match Selection Routing
- **D-09:** Inline state toggle in `page.tsx` — appState reducer switches between `MATCH_SELECT` (match list, no camera) and `AR_HUD_LIVE` (camera + HUD). No separate routes needed.
- **D-10:** Fade transition (~300ms) between match list and camera view — CSS opacity transition.
- **D-11:** Manually seeded fixture IDs from a config file — no REST fixture fetch for demo. 2–3 World Cup match IDs hardcoded for hackathon.

### Service Worker Strategy
- **D-12:** Use `serwist` (actively maintained fork of `@ducanh2912/next-pwa`) as the PWA/service worker package.
- **D-13:** Full offline shell — cache both match list screen and camera HUD layout via precaching.
- **D-14:** Update banner with "New Update Available" / "Refresh Now" button per UI-SPEC copywriting — `SwUpdateNotification` component.

### Agent's Discretion
- TxODDS SSE event format mapping details (exact field mapping to TxLineEventPacket)
- Exact retry backoff schedule (e.g., 1s, 2s, 4s, 8s max)
- Connection status dot colors per UI-SPEC (already defined in visual contract)
- Implementation details of the fade transition CSS

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Design Contract
- `.planning/phases/02-live-data/02-UI-SPEC.md` — Locked requirements: visual contracts, component inventory, state machine, copywriting, connection states, color tokens

### Core Architecture
- `lib/txline/TxLineSource.ts` — Subscription interface decoupling mock from live (must be implemented by `TxLineSseSource`)
- `lib/txline/TxLineProvider.tsx` — Current React Context provider to be extended with `useReducer`
- `lib/schema/txLineSchema.ts` — Zod schema for `TxLineEventPacket` (target data format for the adapter)
- `app/page.tsx` — Main page shell where appState reducer and MatchSelector toggle are added

### Existing Components (unchanged, serve as patterns)
- `app/components/Scoreboard.tsx` — Reads from `useTxLine()`
- `app/components/OddsMatrix.tsx` — Reads from `useTxLine()`
- `app/components/ConsensusIndicator.tsx` — Reads from `useTxLine()`
- `app/components/CameraBackdrop.tsx` — Camera `<video>` setup pattern

### Project Requirements
- `.planning/REQUIREMENTS.md` — Phase 2 reqs (LIVE-01..03, OFFL-01..02)

### External References
- TxLINE documentation: `https://txline.txodds.com/documentation/quickstart` — Auth flow, subscribe, activation
- TxLINE OpenAPI spec: `https://txline.txodds.com/docs/docs.yaml` — Full endpoint reference
- TxLINE GitHub: `https://github.com/txodds/tx-on-chain` — SDK, IDL, examples
- Devnet API: `https://txline-dev.txodds.com/api/`
- Mainnet API: `https://txline.txodds.com/api/`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/txline/TxLineSource.ts` — Interface awaiting a live-data implementation. `TxLineSseSource` will implement `subscribe(callback) → () => void`.
- `lib/txline/TxLineProvider.tsx` — The provider to extend with useReducer and connection status context.
- `lib/txline/mockData.ts` — `createMockTxLineSource()` — reference implementation of TxLineSource, useful as pattern for the SSE version.
- `app/page.tsx` — Main page with camera flow, HUD layout, and `activeBet` state. New appState reducer integrates here.
- Existing `useTxLine()` hook — Components already consume data through it; no changes needed to individual widgets.

### Established Patterns
- React Context for data flow (TxLineProvider pattern) — extended with useReducer, not replaced.
- `'use client'` for interactive components.
- Zod validation at data boundary — the TxLineSseSource adapter should validate incoming TxODDS data.

### Integration Points
- `app/page.tsx:13` — `isCameraActive` state → replaced/expanded by appState reducer with `MATCH_SELECT`, `AR_HUD_LIVE`, etc.
- `lib/txline/TxLineProvider.tsx:14` — Where `createMockTxLineSource()` is called → swap for `createTxLineSseSource()` based on config/env.
- Existing HUD widgets read from `useTxLine()` — no changes needed, they work with any TxLineSource.

</code_context>

<specifics>
No specific references requested — the discussion focused on practical implementation decisions. The UI-SPEC copywriting contract covers exact text for all states.
</specifics>

<deferred>
None — discussion stayed within phase scope.
</deferred>

---

*Phase: 02-Live Data*
*Context gathered: 2026-07-09*
