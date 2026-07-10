# Plan 02-02 Summary: Service Worker

## Files Created
- `app/sw.ts` — Serwist SW with precaching, offline fallback, runtime caching
- `app/serwist/[[...path]]/route.ts` — Route handler (adapted for Next.js 16 catch-all types)
- `app/~offline/page.tsx` — Offline fallback with UI-SPEC copywriting
- `app/components/SwUpdateNotification.tsx` — Update banner using useSerwist + lifecycle events

## Files Modified
- `package.json` — Added serwist@9.5.11 + @serwist/turbopack@9.5.11
- `app/layout.tsx` — Wrapped body in SerwistProvider (swUrl="/serwist/sw.js") + SwUpdateNotification

## Build Verification
- `npx next build` succeeds, SW compiled at /serwist/sw.js + /serwist/sw.js.map
- All app routes build: /, /~offline, /serwist/[[...path]]
