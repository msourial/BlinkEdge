# Stack Research

**Domain:** Mobile-first PWA · AR/HUD camera overlay · Solana blockchain sports companion
**Project:** BlinkEdge (FIFA Solana 2026 hackathon)
**Researched:** 2026-07-06
**Confidence:** HIGH (core stack cross-verified against npm registry + official docs + MDN; Solana ecosystem against solana.com/docs + anza-xyz wallet-adapter repo)

---

## What changed vs. the pre-init STACK.md (read this first)

The planned stack in `.planning/codebase/STACK.md` assumed `next ^15.x · tailwindcss ^3.x · zod ^3.x · tailwind.config.ts`. **Two of those four are now outdated one major version** and the Tailwind config path has been superseded:

| Planned | Actual current (July 2026) | Action |
|---|---|---|
| `next@^15` | `next@16.2.10` stable, Turbopack default | **Bump to ^16** (or pin ^15.5 if you want extra stability — both work with Tailwind v4; see Compatibility) |
| `tailwindcss@^3` + `tailwind.config.ts` | `tailwindcss@4.3.2` + CSS-first `@theme` block | **Move to v4** — DESIGN.md's `{colors.primary}` token references map 1:1 to native CSS variables |
| `zod@^3` | `zod@4.4.3` | **Bump to ^4** — 6.5× faster object parsing, 57% smaller core bundle, native recursive objects, top-level formats |
| `react@^18` | `react@19.2.7` (Next 16 App Router uses React 19 canary built-in) | **Bump to ^19** — required by Next 16 |

The good news: the NeonChrome DESIGN.md was already written as a token-reference design system (`{colors.primary}`, `{glow.spread-md}`, `{typography.button-md}`). That maps **directly** onto Tailwind v4's `@theme` CSS-variable model — better than it would have onto v3's JS config.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why this (and not the alternative) |
|---|---|---|---|
| **next** | `^16.2.10` | App Router framework, metadata routes (`manifest.ts`, `icon.tsx`, `apple-icon.tsx`), API routes (Phase 3 Action endpoints), Turbopack dev server | Required by project constraints. Next 16 is current stable. Built-in `app/manifest.ts` generates the PWA manifest at request time — **no `next-pwa` plugin needed for the manifest alone**. App Router gives RSC + Suspense for free, which is the right model for a fixed `inset-0` HUD shell that hydrates on the client. Turbopack is faster dev iteration (matters for hackathon). Min Node 20.9, supports Safari 16.4+ / Chrome 111+ — matches PROJECT.md's mobile baseline. |
| **react** + **react-dom** | `^19.2.7` | UI runtime | Required by Next 16 App Router (uses React 19 canary built-in). `use()` + Actions + `useFormState` are stable and useful for the camera permission gate. |
| **typescript** | `^5.x` (≥5.1) | Type safety, strict mode | Required by project constraints. Next 16 ships a custom TS plugin for the editor. |
| **tailwindcss** | `^4.3.2` | Utility-first styling, NeonChrome token system | v4's CSS-first `@theme` is the **best fit** for DESIGN.md — every `{colors.*}`, `{glow.*}`, `{rounded.*}` token becomes a native CSS variable that utilities, inline styles, and Framer Motion can all read. Lightning CSS under the hood auto-prefixes `backdrop-filter` with `-webkit-backdrop-filter` (needed for older iOS Safari). v3's `tailwind.config.ts` is the legacy path. |
| **zod** | `^4.4.3` | TxLineEventPacket schema validation at the boundary | Required by project constraints ("Zod schemas at boundary"). v4 is 6.5× faster object parsing, 2.3× smaller core bundle, 100× fewer `tsc` instantiations — meaningful when the schema sits on a 2000ms tick hot path. First-class `z.toJSONSchema()` is a bonus for the Phase 3 Action API. |

### Database

**None in Phase 1.** The Walking Skeleton uses an in-memory `TxLineProvider` with a deterministic 2000ms tick — PROJECT.md explicitly rules out a DB. Defer any persistence decision to Phase 2+ when live TxLINE or a hedge-history feature lands.

(if persistence is added later, the only candidate worth considering is **Neon/Postgres via Drizzle ORM** for hedge history and event replay — but that is out of scope for the hackathon submission and should not be decided now.)

### Infrastructure

| Technology | Version | Purpose | Why |
|---|---|---|---|
| **Vercel** | current | Hosting | Provides HTTPS out of the box — **non-negotiable for `getUserMedia`** (MDN: `navigator.mediaDevices` is `undefined` in insecure contexts). One-click Next 16 deploy. Free tier covers hackathon demo. |
| **Node.js** | `≥20.9` (LTS 20.x or 22.x) | Local dev + build | Minimum required by Next 16. Node 22 recommended for dev. |
| **Turbopack** | bundled with Next 16 | Dev bundler | Default in Next 16; `next dev` uses it. Falls back to webpack via `next dev --webpack` if a dependency misbehaves. |
| **PostCSS** | via `@tailwindcss/postcss` | Tailwind v4 build pipeline | v4 ships its own PostCSS plugin. No `postcss-import` needed (built-in). |

### Solana Ecosystem (Phase 3 prep — listed for roadmap context, NOT to install in Phase 1)

| Package | Version | Purpose | When to install |
|---|---|---|---|
| **@solana/web3.js** | `^1.98.4` | Transaction construction, `Connection`, `sendRawTransaction` | Phase 3 (hedge execution). Not needed for Phase 1 mock. |
| **@solana/wallet-adapter-react** | `^0.15.39` | React context for wallet connection, auto-reconnect, sign/send transaction hooks | Phase 3. Provides `useWallet()` / `useConnection()`. |
| **@solana/wallet-adapter-react-ui** | `^0.9.39` | Pre-built `<WalletMultiButton />` and modal | Phase 3. Saves a day of modal work — appropriate for hackathon; for a polished NeonChrome look, build a custom button but keep the modal. |
| **@solana/wallet-adapter-phantom** (+ other per-wallet packages from `anza-xyz/wallet-adapter`) | per-package latest (e.g. `@solana/wallet-adapter-phantom@0.9.29`) | The wallet-adapter monorepo has migrated to **per-wallet packages** rather than `@solana/wallet-adapter-wallets` bundles | Phase 3. Phantom + Solflare are the only ones worth shipping for a hackathon demo (covers iOS + Android + desktop). |
| **@solana/actions** | `^1.6.6` | Server-side SDK to build Action endpoints (the GET/POST routes that produce signable transactions) | Phase 3. Each Blink is a pair of GT/POST routes returning `ActionGetResponse` / `ActionPostResponse`; this SDK handles the spec boilerplate. |
| **@solana/actions-spec** | current | Type definitions for the Actions spec | Phase 3, alongside `@solana/actions`. |

> ⚠️ The wallet adapter moved from `solana-labs` to `anza-xyz` and split into per-wallet packages. Using the old `@solana/wallet-adapter-wallets` bundle still works (`0.19.38` on npm) but pulls wallets you don't need — prefer per-wallet packages.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| **framer-motion** | `^12.42.2` | Spring/gesture animations for HUD overlays (stagger-in on tick, dismissable swipe, tap-to-hedge button transitions) | **Optional in Phase 1.** Start with CSS transitions for the 2000ms tick pulse — Framer Motion is worth adding only when you need gesture-driven dismissals (Phase 3 hedge flow). Reason: every KB matters on a mobile PWA baseline. |
| **tw-animate-css** (or manual `@starting-style`) | current | Tailwind v4 animation utilities / native enter transitions | Optional. Tailwind v4's `starting:` variant + `transition-discrete` gives CSS-only enter/exit without JS — preferred for the neon pulse on the Scoreboard/Consensus HUDs. |
| **clsx** + **tailwind-merge** | latest | Conditional className composition + Tailwind class de-duplication | Recommended from Phase 1. Tiny (~1KB combined), prevents `'card-neon ' + (active && 'card-neon-magenta')` class collisions. Standard pattern with Tailwind v4. |
| **lucide-react** (or similar neon-compatible icon set) | latest | Icons for the permission gate, collapsed OddsMatrix chip, etc. | Optional Phase 1. DESIGN.md does not specify an icon set; keep it sparse — neon borders are the depth language, icons should be stroke-only. |

### Development Tools

| Tool | Purpose | Notes |
|---|---|---|
| **ESLint** + `eslint-config-next` (or Biome) | Linting | Next 16 dropped running `next lint` at build; add `eslint` to NPM scripts explicitly. Biome is faster and opinionated — fine for a 1-week hackathon, but `eslint-config-next` is the safer default for App Router correctness. |
| **TypeScript strict** + `next plugin` | Static type checking | `tsconfig.json` strict mode + the Next 16 editor plugin ("Use Workspace Version" in VS Code). |
| **@tailwindcss/postcss** | Tailwind build | Add to `postcss.config.mjs`. No `tailwind.config.ts` needed for v4 unless you want one — `@theme` in CSS replaces it. |
| **Playwright** (optional) | E2E for the camera permission flow | Optional Phase 2. Hard to fully test the camera pipeline in CI; manual testing on real iPhone SE / Pixel 4a is the hackathon-fast path. |
| **Blinks Inspector** ([blinks.xyz/inspector](https://www.blinks.xyz/inspector)) | Debug Solana Action GET/POST responses and CORS headers | Phase 3 — must-have when building the hedge Action endpoint. |

## Installation

```bash
# Core (Phase 1)
npm install next@^16.2.10 react@^19.2.7 react-dom@^19.2.7 zod@^4.4.3
npm install -D typescript@^5 @types/node @types/react @types/react-dom

# Tailwind v4 (CSS-first config)
npm install tailwindcss@^4.3.2 @tailwindcss/postcss@^4

# Optional Phase 1 helpers
npm install clsx tailwind-merge

# Phase 3 — Solana ecosystem (install when hedge flow starts, NOT Phase 1)
# npm install @solana/web3.js@^1.98.4 \
#   @solana/wallet-adapter-react@^0.15.39 \
#   @solana/wallet-adapter-react-ui@^0.9.39 \
#   @solana/wallet-adapter-phantom \
#   @solana/wallet-adapter-solflare \
#   @solana/actions@^1.6.6 \
#   @solana/actions-spec
```

`postcss.config.mjs`:
```js
export default { plugins: { '@tailwindcss/postcss': {} } };
```

`app/globals.css` (CSS-first NeonChrome theme — replaces `tailwind.config.ts`):
```css
@import "tailwindcss";

@theme {
  --color-canvas: #0a0a0f;
  --color-surface-chrome: #111118;
  --color-surface-raised: #16161f;
  --color-surface-overlay: #1c1c28;
  --color-surface-deep: #06060a;

  --color-primary: #00f0ff;
  --color-magenta: #ff2d7b;
  --color-acid: #39ff14;
  --color-violet: #b44dff;
  --color-amber: #ffb800;

  --color-ink: #e8eaed;
  --color-ink-body: rgba(232,234,237,0.82);
  --color-ink-muted: rgba(232,234,237,0.55);

  --font-display: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "SF Mono", monospace;

  --radius-md: 8px;   /* buttons */
  --radius-lg: 12px;  /* cards */

  /* Spacing scale — v4 derives px-*/py-* utilities from a single --spacing */
  --spacing: 0.25rem;
}
```

HUD surfaces use **plain CSS** (Tailwind v4 utilities can't express multi-layer `box-shadow` glow cleanly) — put the `glow.spread-*` definitions in a `@layer components` block or inline in the HUD component.

## Alternatives Considered

| Recommended | Alternative | When the alternative actually wins |
|---|---|---|
| **Next.js 16 App Router** | Vite + React SPA | If you don't need SSR/SEO/manifest routes at all and want the absolute smallest client bundle. For this project you DO want `app/manifest.ts` and `app/icon.tsx` for PWA installability + the Phase 3 Action API routes — Next wins. |
| **Next.js 16** (current) | Next.js 15 (LTS-ish) | Pin `next@^15.5` only if you hit a regression on 16 in week 1 of the hackathon. 16 is the project's stated target ecosystem (metadata routes, React 19) and is stable on npm. Default to 16. |
| **Tailwind v4 (`@theme`)** | Tailwind v3 (`tailwind.config.ts`) | If the team has zero Tailwind v4 experience and a hard deadline < 2 days AND already has a v3 config they trust. Otherwise v4 + DESIGN.md token system is the better pairing. |
| **Zod 4** | Zod Mini (`zod/mini`) | Only if gzipped bundle is the absolute top constraint (mobile-first PWA matters). `zod/mini` is 1.88KB core vs 5.36KB for regular zod@4. For a hackathon the regular v4 API is friendlier; revisit if Lighthouse penalises the bundle. |
| **Framer Motion 12** | CSS transitions + `@starting-style` | For the 2000ms tick pulse, **CSS wins** (no JS, no bundle). Reserve Framer Motion for Phase 3 gesture dismissals. |
| **anza-xyz wallet-adapter (per-wallet packages)** | Solana Mobile `wallet-adapter-mobile-react-native` | First-class React Native flow for mobile-only — but BlinkEdge is a PWA, not native. Stick with the React wallet adapter. |
| **`@ducanh2912/next-pwa` (10.2.9)** for offline SW | No service worker in Phase 1 | PROJECT.md explicitly defers SW to Phase 2. When that lands, `@ducanh2912/next-pwa` (the actively maintained fork) is the right pick over the abandoned `next-pwa@5.6.0` legacy. |
| **Vercel** | Cloudflare Pages / self-host | If you have a strong reason to avoid Vercel. For HTTPS-gated `getUserMedia` you need a host with auto-TLS — Vercel is the lowest-friction. |

## What NOT to Use

| Avoid | Why it'll hurt you | Use Instead |
|---|---|---|
| **`tailwind.config.ts` (JS config) as the primary config** | Tailwind v4 still supports it via `@config`, but it's the legacy path — you lose `@theme`'s native CSS-variable output, automatic content detection, and Lightning-CSS auto-prefixing for `-webkit-backdrop-filter`. | `@theme` block in `app/globals.css` |
| **`opacity: 0.x` on a parent container of HUD overlays** | MDN (Apr 2026): **any ancestor with `opacity<1` becomes a "backdrop root"** — the child's `backdrop-filter: blur(16px)` then only blurs content between the parent and child, NOT the camera feed behind the parent. The AR-over-camera effect silently breaks. This is the single most likely subtle bug in this project. | Use `background-color: rgba(10,10,15,0.35)` for translucency, never the `opacity` property on HUD ancestors |
| **`facingMode: { exact: "environment" }`** | MDN: throws `OverconstrainedError` on any device without a rear camera (iPhones in some orientations, desktop). Hard-fails the whole app. | `facingMode: { ideal: "environment" }` (already in ARCHITECTURE.md — keep it) |
| **`@solana/wallet-adapter-wallets` (the bundle)** | Still works (0.19.38) but pulls every wallet adapter — bloats the bundle and masks which wallets you actually support. | Per-wallet packages: `@solana/wallet-adapter-phantom`, `@solana/wallet-adapter-solflare` |
| **`next-pwa@5.6.0`** (the original) | Unmaintained. Last meaningful release is years stale and breaks on Next 16. | `@ducanh2912/next-pwa@10.2.9` when you add a service worker in Phase 2 |
| **WebXR AR session (`hit-test`)** for the camera overlay | Massively over-scoped for "see TV through translucent widgets." WebXR AR is for placing 3D anchors in physical space — BlinkEdge wants a 2D HUD over a 2D camera feed. | Plain `<video>` + `getUserMedia` + absolutely-positioned HUD widgets (exactly what ARCHITECTURE.md already specifies) |
| **A component library (shadcn/ui, Radix stash, Mantine)** | The NeonChrome aesthetic is the whole judging criterion ("Fan UX"). Any prebuilt component imports its own spacing/radius/shadow vocabulary that fights `glow-as-depth`. | Build the ~6 components in DESIGN.md by hand (card-neon, button-neon-*, badge-neon, input-neon) |
| **Pure black `#000000` backgrounds** | DESIGN.md forbids it — the chrome identity is `#0a0a0f` with a subtle blue undertone. Pure black also amplifies OLED bloom against neon glows. | `--color-canvas: #0a0a0f` in `@theme` |
| **Drop shadows (`shadow-*`)** | DESIGN.md forbids them — depth = `box-shadow` neon glow only, no drop shadow. | Multi-layer neon `box-shadow` (`glow.spread-*` tokens) |
| **A real database in Phase 1** | PROJECT.md explicitly out of scope. Walking Skeleton principle: in-memory mock is sufficient to demo the AR/HUD pipeline. | In-memory `TxLineProvider` with a 2000ms tick |

## Stack Patterns by Variant

**If you ship the Phase 1 Walking Skeleton (recommended starting point):**
- Install only: `next@16`, `react@19`, `zod@4`, `tailwindcss@4` + `@tailwindcss/postcss`, `clsx`, `tailwind-merge`.
- Camera via `navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })` inside a 44px-touch-target button click handler (iOS Safari gesture requirement).
- HUD translucency via `background-color: rgba(10,10,15,0.35)` + `backdrop-filter: blur(16px)` + `will-change: backdrop-filter` + `contain: layout paint`. Max 3 concurrent blurred HUDs.
- No Solana code at all — mock provider only.

**If you ship Phase 3 (hedge execution via Blink):**
- Install the Solana packages listed above (commented block in Installation).
- The hedge Action is a Next.js API route pair: `app/api/actions/hedge/route.ts` handling `GET` (return `ActionGetResponse` with the hedge `label: "Hedge 0.5 SOL"`) and `POST` (return base64-serialized `Transaction` per `ActionPostResponse`). The PWA itself either (a) renders the Blink via the wallet adapter (`fetch` the POST, decode base64, sign via `useWallet().signTransaction`, send via `Connection.sendRawTransaction`) — recommended for the in-app one-tap experience — or (b) generates a `solana-action:https://blinkedge.app/api/actions/hedge?matchId=…` URL that opens in Phantom/Solflare's Blink reader.
- Host must serve `actions.json` at `/actions.json` with `Access-Control-Allow-Origin: *` (spec requirement). Add this route + a static CORS handler.

**If you want offline PWA resilience (Phase 2, deferred):**
- Add `@ducanh2912/next-pwa@10.2.9`, generate a Workbox service worker that caches the app shell (not the live camera stream — that's never caching).
- This is explicitly out of scope per PROJECT.md for Phase 1. Don't pull it forward.

## Version Compatibility

| Package A | Compatible With | Notes |
|---|---|---|
| `next@16.2.10` | `react@19.2.7`, `react-dom@19.2.7` | Next 16 App Router uses React 19 canary built-in; declare `react@19` for tooling compat. Min Node 20.9. |
| `next@16` | `tailwindcss@4` + `@tailwindcss/postcss@4` | Use PostCSS plugin path (not the Vite plugin). No `tailwind.config.ts` needed. |
| `next@16` | `@ducanh2912/next-pwa@10.2.9` | Compatible with App Router; the abandoned `next-pwa@5.6.0` is NOT. |
| `tailwindcss@4` | `@tailwindcss/postcss@4` | Versions are coupled — do NOT mix a v4 core with the v3 `tailwindcss/postcss` package. |
| `zod@4` | React 19, Next 16 | First-class. `z.toJSONSchema()` works server-side; safe to use inside Next API routes. |
| `framer-motion@12` | React 19 | Supported as of `motion` v12 (the package is still published as `framer-motion`). Earlier v11 had React 19 peer-dep warnings — use v12. |
| `@solana/wallet-adapter-react@0.15.39` | React 19 | Check peer deps when you install in Phase 3; the anza-xyz packages are actively updated. |
| `@solana/actions@1.6.6` | `@solana/web3.js@1.98.4` | Both target the same Solana RPC/version — install together in Phase 3. |
| `getUserMedia` (browser API) | iOS Safari 11+ / Android Chrome | Baseline widely available since Sept 2017. **HTTPS mandatory.** Note iOS Safari handles `facingMode: {ideal: "environment"}` correctly; some Android Chrome versions persist the front camera — call `track.stop()` before re-requesting. |
| `backdrop-filter` (browser CSS) | Baseline 2024 (Sept 2024) | Chrome 76+, Safari 18+ unprefixed, Safari 9–17 needs `-webkit-backdrop-filter` (Tailwind v4 + Lightning CSS auto-prefixes this). **Trapped by any ancestor that's a backdrop root** — see "What NOT to Use". |

## Sources

- **npm registry** (live, 2026-07-06) — version pins for `next`, `react`, `tailwindcss`, `zod`, `@solana/web3.js`, `@solana/wallet-adapter-*`, `@solana/actions`, `framer-motion`, `next-pwa`, `@ducanh2912/next-pwa`. **Confidence: HIGH.**
- **Tailwind CSS v4.0 launch blog** ([tailwindcss.com/blog/tailwindcss-v4](https://tailwindcss.com/blog/tailwindcss-v4), Jan 22 2025) — confirmed CSS-first `@theme`, native cascade layers, dynamic utilities, container queries in core, `@starting-style` variant, Lightning CSS prefixing. **Confidence: HIGH.**
- **Next.js 16.2.10 installation docs** ([nextjs.org/docs/app/getting-started/installation](https://nextjs.org/docs/app/getting-started/installation)) — App Router + Turbopack default, React 19, Node 20.9 min, browser support matrix, built-in `next/font` and metadata routes. **Confidence: HIGH.**
- **Zod v4 release notes** ([zod.dev/v4](https://zod.dev/v4)) — stable release, 14× string / 7× array / 6.5× object parsing, 2× smaller core bundle, `z.toJSONSchema()`, top-level string formats, recursive objects. **Confidence: HIGH.**
- **Solana Actions & Blinks spec** ([solana.com/docs/advanced/actions](https://solana.com/docs/advanced/actions)) — full GET/POST response interfaces, `actions.json` rules, CORS headers (`Access-Control-Allow-Origin: *`), URL scheme `solana-action:<url>`, Dialect registry verification (only for Twitter/X unfurl), Blinks Inspector tool. **Confidence: HIGH.**
- **anza-xyz/wallet-adapter GitHub repo** ([github.com/anza-xyz/wallet-adapter](https://github.com/anza-xyz/wallet-adapter)) — migrated from `solana-labs` to `anza-xyz`, per-wallet packages now the norm (e.g. `@solana/wallet-adapter-phantom@0.9.29`), 2k stars. **Confidence: HIGH.**
- **MDN: `MediaDevices.getUserMedia()`** ([developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), last modified Nov 2025) — Baseline widely available since 2017; secure-context requirement; `facingMode: {exact}` vs `{ideal}` semantics; `track.stop()` needed before re-requesting different camera. **Confidence: HIGH.**
- **MDN: `backdrop-filter`** ([developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter), last modified April 2026) — Baseline 2024 (newly available Sept 2024); backdrop root definition; **opacity<1, filter, mix-blend-mode, mask, clip-path, or `will-change` of those on an ancestor traps the blur**. **Confidence: HIGH.** — this is the most important finding for the project (it directly contradicts a naive "translucent HUD = opacity" instinct).

---
*Stack research for: Mobile-first AR/HUD PWA + Solana sports companion (BlinkEdge, FIFA Solana 2026 hackathon)*
*Researched: 2026-07-06*