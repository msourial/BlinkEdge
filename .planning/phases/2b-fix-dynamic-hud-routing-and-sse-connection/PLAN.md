# Plan: Phase 2b — Fix Dynamic HUD Routing and SSE Connection

## Goal
Fix the SSE authentication flow, clean up HUD routing issues, and remove dead code that blocks reliable data display.

## Tasks

### Wave 1: SSE Auth Integration
- **1a**: Integrate `txLineAuth.ts` into `TxLineProvider.tsx` — call `getGuestJwt()` then `activateApiToken()` before creating the SSE source
- **1b**: Pass real JWT/apiToken to `createTxLineSseSource()` instead of empty strings
- **1c**: Clean up old SSE source on fixtureId change before creating new one

### Wave 2: HUD Routing Fixes
- **2a**: Fix `DataErrorBanner` to not render over match list (`MATCH_SELECT` phase)
- **2b**: Consolidate duplicate `useConnectionBus` exports — remove from `TxLineProvider.tsx`, keep only in `useConnectionStatus.tsx`
- **2c**: Remove unused `CameraBackdrop.tsx`

### Wave 3: Dynamic Team Names
- **3a**: Pass fixture team names from `MatchSelector` through the app state so Scoreboard, ConsensusIndicator, and MockHedgeModal show real team names instead of hardcoded "BRA"/"ARG"

## Verification
- `npm run build` succeeds
- `npm run test` passes
- Check that unused imports are cleaned up
