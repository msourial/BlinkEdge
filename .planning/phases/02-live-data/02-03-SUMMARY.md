# Plan 02-03 Summary: UI Components

## Files Created
- `app/components/MatchCard.tsx` — Fixture card with team names, scores, time/status
- `app/components/MatchSelector.tsx` — Match selection with loading/loaded/empty/error states
- `app/components/ApiStatusIndicator.tsx` — Connection state pill with dot + label for all 5 states
- `app/components/DataErrorBanner.tsx` — Connection lost/stale banners with retry/go-back

## Files Modified
- `app/page.tsx` — useReducer for app state, fade transitions, camera auto-start, back button, all new components integrated
- `vitest.config.ts` — Added app/**/*.test.tsx include pattern + jsdom directive comment

## Integration
- MatchSelector replaces old "Tap to Scan" screen, dispatches SELECT_MATCH
- Camera auto-starts on CAMERA_INIT phase via useEffect
- Fade transitions (300ms) between match list and camera+HUD
- ApiStatusIndicator in top-right corner during AR_HUD_LIVE
- DataErrorBanner at bottom of phone frame on error/stale
- Back button in HUD dispatches GO_BACK
- All existing HUD widgets (Scoreboard, OddsMatrix, ConsensusIndicator) preserved
