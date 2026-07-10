# Plan 02-01 Summary: Data Layer

## Files Created
- `lib/txline/txLineFixtureIds.ts` — Config constants (DEVNET_ORIGIN, paths, FIXTURE_IDS)
- `lib/txline/txLineConnectionBus.ts` — ConnectionEventBus with 5-state management + subscriber pattern
- `lib/txline/txLineConnectionBus.test.ts` — 5 tests, all pass
- `lib/txline/txLineAuth.ts` — getGuestJwt + activateApiToken functions
- `lib/txline/txLineAppMachine.ts` — AppState reducer with all documented transitions
- `lib/txline/txLineAppMachine.test.ts` — 10 tests, all pass
- `lib/txline/txLineSseAdapter.ts` — SSE parser (readSseMessages), score/odds/merge functions
- `lib/txline/txLineSseSource.ts` — createTxLineSseSource with fetch-based SSE, retry, stale detection
- `lib/txline/txLineSseAdapter.test.ts` — 12 tests, all pass
- `lib/txline/useConnectionStatus.tsx` — ConnectionStatusProvider + useConnectionStatus hook
- `lib/txline/useConnectionStatus.test.tsx` — 2 tests, all pass

## Files Modified
- `lib/txline/TxLineProvider.tsx` — Uses createTxLineSseSource, exposes connectionBus in context

## Tests
41 Data layer tests pass (5 test files)
