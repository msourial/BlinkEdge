---
phase: 1
name: Walking Skeleton — Camera-as-Canvas HUD Shell
wave: 1
depends_on: []
files_modified:
  - app/layout.tsx
  - app/page.tsx
  - app/manifest.ts
  - app/icon.tsx
  - app/apple-icon.tsx
  - app/components/CameraBackdrop.tsx
  - app/components/CameraPermissionGate.tsx
  - app/components/Scoreboard.tsx
  - app/components/OddsMatrix.tsx
  - app/components/ConsensusIndicator.tsx
  - lib/txline/TxLineProvider.tsx
  - lib/txline/mockData.ts
  - lib/txline/types.ts
  - lib/txline/TxLineSource.ts
  - lib/schema/txLineSchema.ts
  - lib/perf/blurBudget.ts
  - lib/perf/useBlurBudget.ts
  - app/globals.css
  - package.json
  - tsconfig.json
  - next.config.js
autonomous: false
requirements:
  - PWA-01
  - PWA-02
  - PWA-03
  - PWA-04
  - PWA-05
  - CAM-01
  - CAM-02
  - CAM-03
  - CAM-05
  - CAM-06
  - HUD-01
  - HUD-02
  - HUD-03
  - HUD-04
  - HUD-05
  - HUD-06
  - DATA-01
  - DATA-02
  - DATA-03
  - DATA-04
  - DSGN-01
  - DSGN-02
  - DSGN-03
  - DSGN-04
  - DSGN-05
  - DSGN-06
  - DSGN-07
  - DSGN-08
---

# Phase 1: Walking Skeleton — Camera-as-Canvas HUD Shell

## Goal

Ship a demoable AR companion: live rear-camera feed fills the viewport, three neon HUD widgets (Scoreboard cyan, OddsMatrix magenta, ConsensusIndicator acid) float over it with translucent `backdrop-blur(16px)`, driven by a mock TxLineProvider with deterministic 2000ms tick (seeded PRNG, guaranteed red card at minute 67 for demo narrative). Installable PWA. No Solana code — mock hedge modal placeholder with amber "MOCK HEDGE" badge.

**Judging axis:** Fan UX (camera-as-canvas AR overlay, triple-neon HUD composition)

---

## Context

<files_to_read>
- DESIGN.md (NeonChrome design system — 699 lines, full token reference)
- .planning/PROJECT.md (product vision, constraints, key decisions)
- .planning/REQUIREMENTS.md (PWA/CAM/HUD/DATA/DSGN requirement IDs)
- .planning/research/SUMMARY.md (architecture patterns, pitfalls, phase rationale)
- .planning/research/ARCHITECTURE.md (detailed component design)
- .planning/research/PITFALLS.md (7 critical pitfalls with mitigations)
- .planning/codebase/ARCHITECTURE.md (planned data flow, layout, performance budget)
- .planning/codebase/CONVENTIONS.md (NeonChrome rules, mobile-first, performance)
- .planning/codebase/TESTING.md (Vitest + React Testing Library strategy)
- design-system/blinkedge/MASTER.md (NeonChrome design contract)
- design-system/blinkedge/pages/ar-hud-canvas.md (AR/HUD page overrides)
- graphify-out/GRAPH_REPORT.md (knowledge graph — god nodes, communities)
</files_to_read>

---

## Tasks

### Task 1: Project Scaffold + Tailwind v4 @theme

**read_first:**
- .planning/research/STACK.md (Next.js 16, Tailwind v4, Zod 4 version pins)
- .planning/codebase/STACK.md (planned dependencies)
- DESIGN.md (NeonChrome color/typography/spacing/glow tokens)
- design-system/blinkedge/MASTER.md (CSS variable mapping)

**actions:**
1. `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"` (Next.js 16 App Router)
2. Install: `npm install zod@4 clsx tailwind-merge`
3. Configure `app/globals.css` with Tailwind v4 `@theme` block mapping all NeonChrome tokens:
   - Colors: `--color-canvas: #0a0a0f`, `--color-primary: #00f0ff`, `--color-magenta: #ff00e5`, `--color-acid: #39ff14`, `--color-amber: #ffb800`, surfaces, inks
   - Typography: Inter + JetBrains Mono via `@import url(...)`
   - Spacing: `--space-xs` through `--space-2xl` (4/8px rhythm)
   - Glow: `--glow-sm` through `--glow-spread-lg` (multi-layer box-shadow)
4. Verify: `npm run dev` starts without errors, `bg-canvas` class renders `#0a0a0f`

**acceptance_criteria:**
- [ ] `next@16.x`, `react@19.x`, `tailwindcss@4.x`, `zod@4.x` in package.json
- [ ] `app/globals.css` contains `@theme` block with all NeonChrome tokens
- [ ] `bg-canvas` utility maps to `#0a0a0f` (NOT pure `#000000`)
- [ ] No drop shadow utilities defined (glow-as-depth only)
- [ ] `npm run dev` starts on localhost:3000 without errors
- [ ] TypeScript strict mode enabled in `tsconfig.json`

**verify:** `npm run dev` + visual check of `bg-canvas` background color

**requirements:** DSGN-01, DSGN-02, DSGN-03

---

### Task 2: Root Layout + Viewport Meta (PWA Shell)

**read_first:**
- .planning/codebase/ARCHITECTURE.md (full-screen app shell spec)
- .planning/research/PITFALLS.md (Pitfall #3: 100vh layout, safe-area insets)
- design-system/blinkedge/pages/ar-hud-canvas.md (viewport meta, safe-area CSS)

**actions:**
1. `app/layout.tsx`: Root layout with viewport meta:
   ```tsx
   export const viewport: Viewport = {
     width: 'device-width',
     initialScale: 1,
     maximumScale: 1,
     viewportFit: 'cover',
   };
   ```
2. Set `<html lang="en" className="dark">` + `<body className="bg-canvas text-ink overflow-hidden">`
3. Load Inter + JetBrains Mono fonts via `next/font/google`
4. Verify: `env(safe-area-inset-*)` returns non-zero on iOS Simulator with `viewport-fit: cover`

**acceptance_criteria:**
- [ ] Viewport meta includes `viewport-fit: cover` and `maximum-scale: 1`
- [ ] `<body>` has `overflow: hidden` (locks canvas, prevents scroll bounce)
- [ ] Inter + JetBrains Mono loaded via `next/font/google`
- [ ] No `100vh` anywhere in CSS (use `100dvh` only)

**verify:** iOS Safari mobile web inspector — `window.visualViewport.height` updates on URL bar show/hide

**requirements:** PWA-02, PWA-03, PWA-04

---

### Task 3: PWA Manifest + Icons

**read_first:**
- .planning/research/STACK.md (Next.js metadata routes)
- .planning/codebase/STRUCTURE.md (manifest.ts, icon.tsx, apple-icon.tsx)

**actions:**
1. `app/manifest.ts`: Web App Manifest with `display: standalone`, `orientation: portrait`, BlinkEdge theme colors (`#0a0a0f` background, `#00f0ff` accent)
2. `app/icon.tsx`: Dynamic PWA icon (cyan neon border on dark chrome)
3. `app/apple-icon.tsx`: iOS home screen icon
4. Verify: Lighthouse PWA audit passes "installable" check

**acceptance_criteria:**
- [ ] `app/manifest.ts` returns valid manifest with `display: standalone`
- [ ] `app/icon.tsx` generates 192x192 and 512x512 icons
- [ ] `app/apple-icon.tsx` generates iOS-compatible icon
- [ ] App is installable on Chrome Android (Add to Home Screen works)

**verify:** Lighthouse PWA audit + Chrome DevTools Application > Manifest

**requirements:** PWA-01, PWA-05

---

### Task 4: App Shell + Z-Stack Layout

**read_first:**
- design-system/blinkedge/pages/ar-hud-canvas.md (z-index scale 10/20/30/50)
- .planning/research/SUMMARY.md (Architecture Pattern 1: Camera-as-Canvas Layer Stack)
- .planning/research/PITFALLS.md (Pitfall #2: backdrop-filter GPU death)

**actions:**
1. `app/page.tsx`: Fixed inset-0 100dvh canvas:
   ```tsx
   <main className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-canvas">
     <CameraBackdrop />
     <Scoreboard />
     <OddsMatrix />
     <ConsensusIndicator />
   </main>
   ```
2. HUD widgets are **direct children** of opaque `<main>` (NEVER wrap in translucent scrim)
3. Z-index: `<video>` z-0, gradient fallback z-10, HUDs z-20, (future: RiskAlertSheet z-30, BlinkHedgeCard z-40, modals z-50)
4. Verify: No ancestor of any `backdrop-filter` element has `opacity < 1`

**acceptance_criteria:**
- [ ] `app/page.tsx` uses `fixed inset-0 h-[100dvh]` (NOT `100vh`)
- [ ] HUD widgets are direct siblings of `<CameraBackdrop>`, not nested in a scrim
- [ ] Z-index scale follows 0/10/20/30/40/50 system (no arbitrary `z-[9999]`)
- [ ] No element with `opacity < 1` is an ancestor of a `backdrop-filter` element

**verify:** DevTools Elements panel — inspect HUD widget ancestors, confirm no `opacity<1` in chain

**requirements:** PWA-02, HUD-06

---

### Task 5: CameraBackdrop + CameraPermissionGate

**read_first:**
- .planning/research/ARCHITECTURE.md (CameraBackdrop + CameraPermissionGate design)
- .planning/research/PITFALLS.md (Pitfall #1: iOS camera freeze, Pitfall #6: rear camera fallback)
- .planning/codebase/CONCERNS.md (Concern #1: Camera API Permission UX, #6: Rear camera)

**actions:**
1. `app/components/CameraBackdrop.tsx`: `'use client'` component
   - `getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })`
   - `<video autoPlay muted playsInline className="object-cover h-full w-full" />`
   - On deny/error: render gradient fallback (`bg-canvas` with radial `primary-glow-wide` gradient)
2. `app/components/CameraPermissionGate.tsx`:
   - "Enable Camera" button (44px min height, `button-neon-cyan` variant)
   - On grant: hide gate, mount `<video>`
   - On deny: show fallback message + "Try again" button
3. **iOS re-acquire:** `visibilitychange` listener → `track.stop()` on hidden → re-`getUserMedia` on visible with 200ms exponential backoff
4. "Camera re-connecting…" amber overlay during re-acquire

**acceptance_criteria:**
- [ ] `getUserMedia` requests rear camera (`facingMode: { ideal: 'environment' }`)
- [ ] `<video>` uses `object-fit: cover` (GPU-friendly, no JS resize)
- [ ] Permission gate button is 44px min height
- [ ] Gradient fallback renders on deny/error
- [ ] `visibilitychange` listener stops track on hidden, re-acquires on visible
- [ ] No `onended` reliance (iOS doesn't fire it when tab backgrounds)

**verify:** iOS Safari — switch tabs, return — camera re-acquires with amber overlay

**requirements:** CAM-01, CAM-02, CAM-03, CAM-05, CAM-06

---

### Task 6: HUD Widgets (Scoreboard + OddsMatrix + ConsensusIndicator)

**read_first:**
- design-system/blinkedge/pages/ar-hud-canvas.md (HUD widget → card variant mapping, mobile layout)
- design-system/blinkedge/MASTER.md (card-neon component spec, glow system)
- .planning/codebase/CONVENTIONS.md (HUD widget rules, translucency, anti-patterns)
- DESIGN.md (card-neon, card-neon-magenta, card-neon-acid component specs)

**actions:**
1. `app/components/Scoreboard.tsx`: `'use client'`, top-center, `card-neon` (cyan border)
   - `absolute top-0 inset-x-0` + `padding-top: env(safe-area-inset-top)`
   - Displays: live score + match minute (JetBrains Mono, `text-code-md`)
   - Reads from `useTxLine()` context
2. `app/components/OddsMatrix.tsx`: `'use client'`, right-edge, `card-neon-magenta`
   - `absolute right-0 top-1/2 -translate-y-1/2` + `padding-right: env(safe-area-inset-right)`
   - Displays: betting odds (JetBrains Mono)
   - Phase 1 MVP: static card, no responsive collapse
3. `app/components/ConsensusIndicator.tsx`: `'use client'`, bottom-center, `card-neon-acid`
   - `absolute bottom-0 inset-x-0` + `padding-bottom: env(safe-area-inset-bottom)`
   - Displays: market consensus (JetBrains Mono)
4. All HUD widgets:
   - `background: rgba(10,10,15,0.35)` (NEVER `opacity: 0.35`)
   - `backdrop-filter: blur(16px)` + `-webkit-backdrop-filter`
   - `will-change: backdrop-filter` + `contain: layout paint`
   - `box-shadow: var(--glow-spread-sm)` + inset glow
   - `text-shadow: 0 0 4px rgba(10,10,15,0.9)` on all text (legibility over video)

**acceptance_criteria:**
- [ ] Scoreboard: top-center, cyan border, `card-neon` spec
- [ ] OddsMatrix: right-edge, magenta border, `card-neon-magenta` spec
- [ ] ConsensusIndicator: bottom-center, acid border, `card-neon-acid` spec
- [ ] All HUDs use `rgba(10,10,15,0.35)` background (NOT `opacity` property)
- [ ] All HUDs have `backdrop-filter: blur(16px)` + `will-change` + `contain`
- [ ] All HUD text has `text-shadow` halo for legibility
- [ ] Safe-area insets applied (notch/home indicator not covered)
- [ ] No two neon colors on one element

**verify:** Visual inspection on 375px viewport — 3 neon HUDs visible over camera, TV broadcast visible through

**requirements:** HUD-01, HUD-02, HUD-03, HUD-04, HUD-06, DSGN-05, DSGN-06, DSGN-07

---

### Task 7: TxLineProvider + Mock Data (Deterministic)

**read_first:**
- .planning/research/SUMMARY.md (Architecture Pattern 2: Anticipatory Provider Seam)
- .planning/research/ARCHITECTURE.md (TxLineProvider + TxLineSource design)
- .planning/REQUIREMENTS.md (DATA-01 through DATA-05)

**actions:**
1. `lib/txline/types.ts`: TypeScript types derived from Zod schema (`TxLineEventPacket`, `TxLineEvent`, `RiskAssessment` stub)
2. `lib/txline/TxLineSource.ts`: Interface contract:
   ```typescript
   interface TxLineSource {
     subscribe(callback: (packet: TxLineEventPacket) => void): () => void;
   }
   ```
3. `lib/txline/mockData.ts`: Deterministic mock with seeded PRNG
   - Seeded random generator (same seed = same sequence)
   - Event grammar: goal, card (red at minute 67!), injury, odds change
   - 2000ms tick cadence
   - Match: Team A vs Team B, starting score 0-0
4. `lib/txline/TxLineProvider.tsx`: `'use client'` React context
   - `useState` for current packet
   - `useEffect` with `setInterval(2000)` calling mock source
   - `useTxLine()` hook for consumers
5. Wrap `<TxLineProvider>` around HUD widgets in `app/page.tsx`

**acceptance_criteria:**
- [ ] `TxLineSource` interface defined (Phase 2 will swap mock for SSE)
- [ ] Mock data is deterministic (same seed produces same event sequence)
- [ ] Red card event guaranteed at minute 67 (for demo narrative)
- [ ] 2000ms tick cadence (not faster — mobile perf)
- [ ] `useTxLine()` hook provides current packet to HUD widgets
- [ ] Scoreboard/OddsMatrix/ConsensusIndicator read from `useTxLine()`

**verify:** `vi.useFakeTimers()` test — advance 2s, verify new packet emitted; advance to minute 67, verify red card

**requirements:** DATA-01, DATA-03, DATA-04

---

### Task 8: Zod Schema (TxLineEventPacket)

**read_first:**
- .planning/research/STACK.md (Zod 4 features)
- .planning/REQUIREMENTS.md (DATA-02 schema fields)
- .planning/codebase/CONCERNS.md (Concern #5: ZOD_SCHEMAS.md missing — resolve now)

**actions:**
1. `lib/schema/txLineSchema.ts`: Zod 4 schema for `TxLineEventPacket`:
   ```typescript
   const txLineEventSchema = z.object({
     type: z.enum(['goal', 'card', 'injury', 'odds_change', 'substitution']),
     minute: z.number().int().min(0).max(120),
     team: z.string().optional(),
     player: z.string().optional(),
     cardType: z.enum(['yellow', 'red']).optional(),
   });
   const txLineEventPacketSchema = z.object({
     matchId: z.string(),
     timestamp: z.number(),
     minute: z.number().int().min(0).max(120),
     score: z.object({ home: z.number(), away: z.number() }),
     possession: z.object({ home: z.number(), away: z.number() }),
     events: z.array(txLineEventSchema),
     oddsSnapshot: z.object({
       home: z.number(), draw: z.number(), away: z.number(),
     }),
     consensus: z.object({
       direction: z.enum(['home', 'draw', 'away']),
       confidence: z.number().min(0).max(1),
     }),
   });
   ```
2. Validate mock data output against schema in `TxLineProvider` before setting state
3. Export inferred type: `type TxLineEventPacket = z.infer<typeof txLineEventPacketSchema>`

**acceptance_criteria:**
- [ ] Zod schema covers all fields: matchId, timestamp, minute, score, possession, events[], oddsSnapshot, consensus
- [ ] Mock data passes schema validation
- [ ] Invalid data (e.g., minute > 120) is rejected
- [ ] `TxLineEventPacket` type exported and used by HUD widgets

**verify:** Unit test — valid packet accepted, invalid packet (minute 150, bad enum) rejected

**requirements:** DATA-02

---

### Task 9: Blur Budget Guard (GPU Performance)

**read_first:**
- .planning/research/PITFALLS.md (Pitfall #2: backdrop-filter GPU death)
- .planning/research/SUMMARY.md (Architecture Pattern 5: GPU-Scoped Blur Budget Guard)
- .planning/codebase/CONVENTIONS.md (Max 3 concurrent backdrop-blur)

**actions:**
1. `lib/perf/blurBudget.ts`: Runtime guard for 3-concurrent-blur cap:
   ```typescript
   class BlurBudget {
     private active = 0;
     private readonly max = 3;
     acquire(): boolean { return this.active < this.max ? (this.active++, true) : false; }
     release(): void { this.active = Math.max(0, this.active - 1); }
   }
   export const blurBudget = new BlurBudget();
   ```
2. `lib/perf/useBlurBudget.ts`: React hook:
   - On mount: `acquire()` — if false, use `rgba(10,10,15,0.55)` solid bg (no blur)
   - On unmount: `release()`
   - Auto-downgrade on `navigator.hardwareConcurrency ≤ 4` or `deviceMemory ≤ 4`
3. HUD widgets use `useBlurBudget()` to determine blur vs solid bg

**acceptance_criteria:**
- [ ] `blurBudget` caps concurrent `backdrop-filter` at 3
- [ ] 4th blur request falls back to solid `rgba(10,10,15,0.55)` (no blur)
- [ ] `navigator.hardwareConcurrency ≤ 4` triggers auto-downgrade
- [ ] `acquire()`/`release()` balance correctly on mount/unmount

**verify:** DevTools Performance tab — render 4 HUD widgets, verify 4th uses solid bg; monitor fps ≥30 on 5-min run

**requirements:** HUD-05

---

### Task 10: Mock Hedge Modal Placeholder + NeonChrome Compliance

**read_first:**
- design-system/blinkedge/pages/hedge-modal.md (mock hedge fallback spec)
- .planning/research/PITFALLS.md (Pitfall #6: scope creep — forbid @solana/* in Phase 1)
- design-system/blinkedge/MASTER.md (Pre-Delivery Checklist)

**actions:**
1. Create mock hedge modal component (triggered at minute 67 red card):
   - Amber "MOCK HEDGE" badge (top-right)
   - "Hedge now" CTA → simulated 2s delay → "Hedged ✓ (mock)" confirmation
   - NO wallet connection, NO real transaction, NO `@solana/*` packages
   - `box-shadow: var(--glow-spread-md)` with amber glow
2. Wire: minute 67 red card from mock data → mock hedge modal appears (z-40)
3. Verify `package.json` has NO `@solana/*` packages (scope creep guard)
4. Run Pre-Delivery Checklist from `design-system/blinkedge/MASTER.md`:
   - [ ] No pure `#000000` (grep)
   - [ ] No drop shadows (grep)
   - [ ] Max 1 `spread-lg` per viewport
   - [ ] All body text weight ≤ 400
   - [ ] All body line-height ≥ 1.5
   - [ ] No `rounded.full` on cards/buttons
   - [ ] HUD backgrounds use `rgba()` not `opacity`

**acceptance_criteria:**
- [ ] Mock hedge modal renders at minute 67 with amber "MOCK HEDGE" badge
- [ ] NO `@solana/*` packages in `package.json` (hard scope gate)
- [ ] Pre-Delivery Checklist passes all NeonChrome compliance items
- [ ] `prefers-reduced-motion: reduce` disables bloom animation
- [ ] Touch targets ≥ 44px on all interactive elements

**verify:** `grep -r "@solana" package.json` returns nothing; visual check of mock hedge modal at minute 67

**requirements:** DSGN-04, DSGN-08

---

## Verification Criteria

### Functional
- [ ] Camera permission flow works (grant → video, deny → gradient fallback)
- [ ] iOS `visibilitychange` re-acquire works (tab switch → return → camera reconnects)
- [ ] 3 HUD widgets render over camera with correct neon colors
- [ ] Mock TxLineProvider ticks every 2000ms, HUDs update
- [ ] Red card at minute 67 triggers mock hedge modal
- [ ] PWA installable (manifest + icons)

### Performance
- [ ] ≥30fps on Pixel 4a / iPhone SE 2nd gen for 5 minutes continuous
- [ ] Max 3 concurrent `backdrop-filter` elements (blurBudget guard)
- [ ] Camera `<video>` uses `object-fit: cover` (no JS resize)
- [ ] `will-change: backdrop-filter` + `contain: layout paint` on HUDs

### Design System
- [ ] No pure `#000000` (grep for `#000000` and `#000` in CSS)
- [ ] No drop shadows (all depth via glow box-shadow)
- [ ] No `opacity < 1` ancestor of any `backdrop-filter` element
- [ ] HUD backgrounds use `rgba(10,10,15,0.35)` (NOT `opacity: 0.35`)
- [ ] All neon borders paired with matching glow box-shadow
- [ ] Inter body weight ≤ 400, line-height ≥ 1.5

### Scope Discipline
- [ ] NO `@solana/*` packages in `package.json` (hard gate)
- [ ] Mock hedge modal clearly labeled "MOCK HEDGE" (amber badge)

---

## must_haves

### truths (goal-backward verification)
- Camera feed fills viewport with rear camera (`facingMode: environment`)
- 3 HUD widgets render with translucent `backdrop-blur(16px)` over camera
- TV broadcast visible through HUD widgets (rgba 0.35, NOT opacity property)
- Mock TxLineProvider delivers deterministic 2000ms tick events
- Zod schema validates all TxLineEventPacket data at boundary
- Red card at minute 67 triggers mock hedge modal
- App is installable as PWA (manifest + standalone display)
- No ancestor of any `backdrop-filter` element has `opacity < 1`
- `100dvh` + `fixed inset-0` + `overflow: hidden` prevents layout jumps
- `env(safe-area-inset-*)` padding on HUD overlays (with `viewport-fit: cover`)

### held-out (property-based / non-inferable)
- Blur budget guard caps concurrent `backdrop-filter` at 3 (runtime enforceable)
- Mock data determinism: same seed produces identical event sequence (property test)
- iOS camera re-acquire: `visibilitychange` → `track.stop()` → re-`getUserMedia` (manual UAT)

---

## Threat Model

### Camera Permission (CAM-01, CAM-03)
- **Risk:** Permission denial blocks core UX (camera is the canvas)
- **Mitigation:** Gradient fallback ensures app remains usable on deny; "Try again" button allows re-request
- **Severity:** Medium (UX degradation, not security)

### Mock Data Injection (DATA-02)
- **Risk:** If mock data schema drifts from real TxLINE, Phase 2 swap breaks
- **Mitigation:** Zod schema at boundary (`TxLineProvider` validates before `setState`); `TxLineSource` interface decouples mock from consumers
- **Severity:** Low (Phase 2 concern, caught by schema validation)

### iOS Camera Freeze (CAM-06)
- **Risk:** Stream freezes silently on tab background, app looks alive but is dead
- **Mitigation:** `visibilitychange` listener proactively stops and re-acquires stream
- **Severity:** Medium (UX, not security — but critical for demo reliability)

---

## Dependencies

- **Next.js 16** + **React 19** + **Tailwind v4** + **Zod 4** (install in Task 1)
- **clsx** + **tailwind-merge** (utility for conditional classNames)
- NO `@solana/*` packages (hard scope gate — enforced in Task 10)

---

## Estimated Time

~15 hours (2h/day × 7-8 days)

| Task | Hours |
|------|-------|
| 1. Scaffold + Tailwind @theme | 1.5 |
| 2. Layout + Viewport | 1 |
| 3. Manifest + Icons | 1 |
| 4. App Shell + Z-Stack | 1 |
| 5. CameraBackdrop + PermissionGate | 2.5 |
| 6. HUD Widgets (×3) | 3 |
| 7. TxLineProvider + Mock | 2 |
| 8. Zod Schema | 1 |
| 9. Blur Budget Guard | 1 |
| 10. Mock Hedge + Compliance | 1 |
| **Total** | **15** |
