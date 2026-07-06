---
version: alpha
name: NeonChrome-design-analysis
description: |
  A dark-chrome design system built on deep metallic blacks with highly vibrant,
  glowing neon borders. Surfaces feel like brushed gunmetal — near-black with
  subtle luminance shifts — while every interactive element pulses with saturated
  neon edge-light. The palette is anchored by electric cyan, hot magenta, acid green,
  and ultraviolet, each rendered as a 1px border with a multi-layer box-shadow glow
  that bleeds 8–24px onto the surrounding dark chrome. Typography is geometric and
  technical — Inter for UI, JetBrains Mono for code — with tight tracking and heavy
  display weights. Depth comes entirely from neon glow intensity, not from drop
  shadows. The overall aesthetic is cyberpunk precision: dark, fast, electric.

colors:
  primary: "#00f0ff"
  primary-glow: "rgba(0,240,255,0.45)"
  primary-glow-wide: "rgba(0,240,255,0.15)"
  primary-on: "#000000"

  magenta: "#ff2d7b"
  magenta-glow: "rgba(255,45,123,0.45)"
  magenta-glow-wide: "rgba(255,45,123,0.15)"

  acid: "#39ff14"
  acid-glow: "rgba(57,255,20,0.45)"
  acid-glow-wide: "rgba(57,255,20,0.15)"

  violet: "#b44dff"
  violet-glow: "rgba(180,77,255,0.45)"
  violet-glow-wide: "rgba(180,77,255,0.15)"

  amber: "#ffb800"
  amber-glow: "rgba(255,184,0,0.40)"
  amber-glow-wide: "rgba(255,184,0,0.12)"

  canvas: "#0a0a0f"
  surface-chrome: "#111118"
  surface-raised: "#16161f"
  surface-overlay: "#1c1c28"
  surface-deep: "#06060a"

  chrome-border: "rgba(255,255,255,0.06)"
  chrome-border-strong: "rgba(255,255,255,0.12)"
  chrome-divider: "rgba(255,255,255,0.04)"

  ink: "#e8eaed"
  ink-body: "rgba(232,234,237,0.82)"
  ink-muted: "rgba(232,234,237,0.55)"
  ink-faint: "#55575e"
  ink-ghost: "#3a3c44"

  on-primary: "#000000"
  on-magenta: "#ffffff"
  on-acid: "#000000"
  on-violet: "#ffffff"
  on-amber: "#000000"

  success: "#39ff14"
  warning: "#ffb800"
  error: "#ff2d7b"
  info: "#00f0ff"

typography:
  display-xxl:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 80px
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: -3.2px
  display-xl:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 64px
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: -2.56px
  display-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: -1.44px
  display-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1.08px
  heading-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.48px
  heading-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.3px
  heading-sm:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.16px
  body-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  button-lg:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: 0.5px
  button-md:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: 0.3px
  button-sm:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: 0.5px
  caption:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0.2px
  code-lg:
    fontFamily: "JetBrains Mono, Fira Code, SF Mono, monospace"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.3px
  code-md:
    fontFamily: "JetBrains Mono, Fira Code, SF Mono, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.2px
  code-sm:
    fontFamily: "JetBrains Mono, Fira Code, SF Mono, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.0
    letterSpacing: 1.5px
    textTransform: uppercase

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  xxxl: 48px
  section: 96px
  band: 128px

glow:
  none: "none"
  sm: "0 0 6px"
  md: "0 0 12px"
  lg: "0 0 20px"
  xl: "0 0 32px"
  spread-sm: "0 0 6px, 0 0 12px"
  spread-md: "0 0 8px, 0 0 20px, 0 0 40px"
  spread-lg: "0 0 12px, 0 0 24px, 0 0 48px, 0 0 80px"
  inset: "inset 0 0 12px"

components:
  button-neon-cyan:
    backgroundColor: "transparent"
    borderColor: "{colors.primary}"
    borderWidth: 1px
    textColor: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 10px 24px
    boxShadow: "{glow.spread-md}, inset 0 0 12px {colors.primary-glow-wide}"
    hoverBoxShadow: "{glow.spread-lg}, inset 0 0 20px {colors.primary-glow-wide}"
  button-neon-magenta:
    backgroundColor: "transparent"
    borderColor: "{colors.magenta}"
    borderWidth: 1px
    textColor: "{colors.magenta}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 10px 24px
    boxShadow: "{glow.spread-md}, inset 0 0 12px {colors.magenta-glow-wide}"
  button-neon-filled:
    backgroundColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    borderWidth: 1px
    textColor: "{colors.primary-on}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 10px 24px
    boxShadow: "{glow.spread-lg}"
  button-ghost:
    backgroundColor: "transparent"
    borderColor: "{colors.chrome-border-strong}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: 10px 24px
  card-neon:
    backgroundColor: "{colors.surface-chrome}"
    borderColor: "{colors.primary}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
    boxShadow: "{glow.spread-sm}, inset 0 0 8px {colors.primary-glow-wide}"
  card-neon-magenta:
    backgroundColor: "{colors.surface-chrome}"
    borderColor: "{colors.magenta}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
    boxShadow: "{glow.spread-sm}, inset 0 0 8px {colors.magenta-glow-wide}"
  card-neon-acid:
    backgroundColor: "{colors.surface-chrome}"
    borderColor: "{colors.acid}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
    boxShadow: "{glow.spread-sm}, inset 0 0 8px {colors.acid-glow-wide}"
  card-chrome:
    backgroundColor: "{colors.surface-chrome}"
    borderColor: "{colors.chrome-border}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  card-chrome-raised:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.chrome-border-strong}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  input-neon:
    backgroundColor: "{colors.surface-deep}"
    borderColor: "{colors.chrome-border-strong}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px 16px
    focusBorderColor: "{colors.primary}"
    focusBoxShadow: "{glow.sm} {colors.primary-glow}"
  input-neon-focused:
    backgroundColor: "{colors.surface-deep}"
    borderColor: "{colors.primary}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px 16px
    boxShadow: "{glow.sm} {colors.primary-glow}"
  textarea-neon:
    backgroundColor: "{colors.surface-deep}"
    borderColor: "{colors.chrome-border-strong}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 16px
    minHeight: 120px
    focusBorderColor: "{colors.magenta}"
    focusBoxShadow: "{glow.sm} {colors.magenta-glow}"
  code-block:
    backgroundColor: "{colors.surface-deep}"
    borderColor: "{colors.chrome-border}"
    borderWidth: 1px
    textColor: "{colors.ink-body}"
    typography: "{typography.code-md}"
    rounded: "{rounded.md}"
    padding: 24px
    overflowX: auto
  badge-neon:
    backgroundColor: "rgba(0,240,255,0.1)"
    borderColor: "{colors.primary}"
    borderWidth: 1px
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 12px
    boxShadow: "inset 0 0 8px {colors.primary-glow-wide}"
  badge-neon-magenta:
    backgroundColor: "rgba(255,45,123,0.1)"
    borderColor: "{colors.magenta}"
    borderWidth: 1px
    textColor: "{colors.magenta}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 12px
    boxShadow: "inset 0 0 8px {colors.magenta-glow-wide}"
  nav-bar:
    backgroundColor: "rgba(10,10,15,0.85)"
    backdropFilter: blur(16px)
    borderColor: "{colors.chrome-border}"
    borderWidth: 0 0 1px 0
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    height: 64px
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xxl}"
    rounded: "{rounded.none}"
    padding: 120px 32px 96px
    position: relative
    overflow: hidden
  feature-grid-item:
    backgroundColor: "{colors.surface-chrome}"
    borderColor: "{colors.chrome-border}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  stat-card:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.chrome-border-strong}"
    borderWidth: 1px
    textColor: "{colors.ink}"
    typography: "{typography.heading-lg}"
    rounded: "{rounded.lg}"
    padding: 24px
    textAlign: center
  footer:
    backgroundColor: "{colors.surface-deep}"
    borderColor: "{colors.chrome-border}"
    borderWidth: 1px 0 0 0
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: 64px 32px 32px
---

## Overview

This design system is built on one principle: **dark chrome is the canvas, neon glow is the language**. Every surface sits in a near-black metallic register — `{colors.canvas}` (`#0a0a0f`) for the page, `{colors.surface-chrome}` (`#111118`) for cards, `{colors.surface-raised}` (`#16161f`) for elevated panels. The surfaces have no visible texture; their depth comes from subtle luminance steps, like stacked sheets of dark anodized aluminium.

Against this chrome, every interactive and highlighted element speaks in **glowing neon**. The glow is not decorative — it is the primary depth and hierarchy mechanism. A card with a cyan border and `{glow.spread-md}` reads as "active" or "primary." A card with only `{colors.chrome-border}` reads as "dormant." The intensity of the glow communicates importance: `sm` for subtle accents, `md` for active states, `lg` for hero-level emphasis, `xl` for attention-critical moments.

Four neon colours anchor the system: **Electric Cyan** (`{colors.primary}` — `#00f0ff`) for primary actions and brand identity, **Hot Magenta** (`{colors.magenta}` — `#ff2d7b`) for secondary emphasis and errors, **Acid Green** (`{colors.acid}` — `#39ff14`) for success states and positive indicators, and **Ultraviolet** (`{colors.violet}` — `#b44dff`) for tertiary accents and creative highlights. A fifth, **Amber** (`{colors.amber}` — `#ffb800`), appears sparingly for warnings.

Typography is **Inter** at heavy display weights (700–800) with tight negative tracking, paired with **JetBrains Mono** for code. Display headlines run at 64–80px with line-heights below 1.0 — the type compresses into dense editorial blocks that feel machined rather than typeset. Body text stays at 400 weight with generous 1.5–1.6 line-height for readability against the dark chrome.

**Key Characteristics:**
- True dark chrome canvas (`#0a0a0f`) — darker than pure black, with metallic cool undertone.
- Four-tier surface elevation: canvas → chrome → raised → overlay, each ~6–8% lighter.
- Neon glow as the sole depth language — no drop shadows anywhere; all elevation is glow.
- Every interactive element has a 1px neon border paired with a multi-layer `box-shadow` glow.
- Glows bleed 8–48px onto surrounding dark surfaces, creating ambient light pools.
- Inter at 800/700 weight for display, JetBrains Mono for code — technical, machined feel.
- Tight negative tracking on display sizes (-1.08px to -3.2px) for compressed density.
- Uppercase 11px labels with 1.5px letter-spacing as section eyebrow markers.

## Colors

### Neon Palette
- **Electric Cyan** (`{colors.primary}` — `#00f0ff`): Primary brand colour. Used for hero CTA borders, active card borders, primary link colour, focus rings, and the dominant glow tone. The system's signature colour.
- **Hot Magenta** (`{colors.magenta}` — `#ff2d7b`): Secondary neon. Used for error states, secondary CTA borders, destructive action glows, and accent emphasis in feature grids.
- **Acid Green** (`{colors.acid}` — `#39ff14`): Success and positive indicators. Status dots, confirmation glows, completed-state borders, and positive metric highlights.
- **Ultraviolet** (`{colors.violet}` — `#b44dff`): Tertiary accent. Creative highlights, tag borders, optional feature indicators, and decorative glow accents.
- **Amber** (`{colors.amber}` — `#ffb800`): Warning state. Used sparingly — warning badges, pending states, and caution glows.

### Glow Tokens
Each neon colour has three glow intensities:
- **Glow** (`{colors.*-glow}`): 45% opacity — used for `box-shadow` core spread.
- **Glow Wide** (`{colors.*-glow-wide}`): 12–15% opacity — used for wide ambient spread and inset washes.
- **Glow Spread** (`{glow.spread-*}`): Multi-layer compound shadows combining core + wide + ambient.

### Surface
- **Canvas** (`{colors.canvas}` — `#0a0a0f`): Page background. Cooler than pure black — a deep blue-black that reads as machined metal.
- **Surface Chrome** (`{colors.surface-chrome}` — `#111118`): Card surfaces, default containers. One luminance step above canvas.
- **Surface Raised** (`{colors.surface-raised}` — `#16161f`): Elevated panels, stat cards, dropdown surfaces.
- **Surface Overlay** (`{colors.surface-overlay}` — `#1c1c28`): Modals, popovers, highest elevation chrome.
- **Surface Deep** (`{colors.surface-deep}` — `#06060a`): Code blocks, input fields — slightly darker than canvas for recessed wells.
- **Chrome Border** (`{colors.chrome-border}` — `rgba(255,255,255,0.06)`): Subtle 1px dividers between chrome surfaces.
- **Chrome Border Strong** (`{colors.chrome-border-strong}` — `rgba(255,255,255,0.12)`): Structural borders on cards and inputs.

### Text
- **Ink** (`{colors.ink}` — `#e8eaed`): Primary text. Slightly warm off-white, not pure white — reduces eye strain on dark chrome.
- **Ink Body** (`{colors.ink-body}` — `rgba(232,234,237,0.82)`): Long-form body text.
- **Ink Muted** (`{colors.ink-muted}` — `rgba(232,234,237,0.55)`): Secondary text, captions, nav labels.
- **Ink Faint** (`{colors.ink-faint}` — `#55575e`): Disabled text, tertiary information.
- **Ink Ghost** (`{colors.ink-ghost}` — `#3a3c44`): Placeholder text, extremely low-emphasis markers.
- **On Primary** (`{colors.on-primary}` — `#000000`): Text on filled cyan surfaces.
- **On Magenta** (`{colors.on-magenta}` — `#ffffff`): Text on filled magenta surfaces.
- **On Acid** (`{colors.on-acid}` — `#000000`): Text on filled acid-green surfaces.

### Semantic
- **Success** (`{colors.success}` — `#39ff14`): Same as acid green. Success toasts, completed states.
- **Warning** (`{colors.warning}` — `#ffb800`): Same as amber. Warning toasts, pending states.
- **Error** (`{colors.error}` — `#ff2d7b`): Same as magenta. Error toasts, destructive confirmations.
- **Info** (`{colors.info}` — `#00f0ff`): Same as cyan. Informational callouts.

## Typography

### Font Family

- **Inter** — open-source geometric sans-serif. Used for all display, heading, body, button, and label text. Loaded at weights 400, 600, 700, 800.
- **JetBrains Mono** — open-source monospace. Used for code blocks, inline code, terminal output, and data values.

When Inter is unavailable, **SF Pro Display** (macOS) or **Segoe UI** (Windows) serve as fallbacks. JetBrains Mono falls back to **Fira Code** then **SF Mono**.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xxl}` | 80px | 800 | 0.95 | -3.2px | Hero headline. One per page. |
| `{typography.display-xl}` | 64px | 800 | 0.96 | -2.56px | Section openers. |
| `{typography.display-lg}` | 48px | 700 | 1.0 | -1.44px | Sub-section headers. |
| `{typography.display-md}` | 36px | 700 | 1.1 | -1.08px | Feature titles, card headlines. |
| `{typography.heading-lg}` | 24px | 600 | 1.3 | -0.48px | Card titles, sidebar headings. |
| `{typography.heading-md}` | 20px | 600 | 1.35 | -0.3px | Sub-card titles, list headers. |
| `{typography.heading-sm}` | 16px | 600 | 1.4 | -0.16px | Compact headings, table headers. |
| `{typography.body-lg}` | 18px | 400 | 1.6 | 0 | Marketing lead paragraph. |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default body text, UI labels. |
| `{typography.body-sm}` | 14px | 400 | 1.45 | 0 | Captions, metadata, secondary info. |
| `{typography.button-lg}` | 16px | 700 | 1.0 | 0.5px | Large CTA buttons. |
| `{typography.button-md}` | 14px | 600 | 1.0 | 0.3px | Default button label. |
| `{typography.button-sm}` | 12px | 600 | 1.0 | 0.5px | Compact buttons, pills. |
| `{typography.caption}` | 12px | 400 | 1.5 | 0.2px | Helper text, footnotes. |
| `{typography.code-lg}` | 16px | 400 | 1.6 | -0.3px | Featured code blocks. |
| `{typography.code-md}` | 14px | 400 | 1.6 | -0.2px | Default code blocks, inline code. |
| `{typography.code-sm}` | 12px | 400 | 1.5 | 0 | Compact code, terminal output. |
| `{typography.label}` | 11px | 700 | 1.0 | 1.5px | Uppercase section eyebrows, badges. |

### Principles
- Display sizes always run at `fontWeight: 800` with `lineHeight` below 1.0 and heavy negative tracking — the type compresses into dense, machined blocks.
- Body weight stays at 400. Emphasis comes from colour (neon borders) not weight.
- Code blocks always use JetBrains Mono at 400 weight with slight negative tracking for tightness.
- Labels (eyebrow text) are always uppercase with 1.5px letter-spacing — the contrast with tight display tracking creates section hierarchy.
- Button typography uses 600–700 weight at 1.0 line-height for crisp, single-line labels.

## Layout

### Spacing System
- **Base unit**: 4px, with the working scale on multiples of 4 / 8 / 16 / 24 / 32.
- **Tokens**: `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 24px · `{spacing.xxl}` 32px · `{spacing.xxxl}` 48px · `{spacing.section}` 96px · `{spacing.band}` 128px.
- Section padding: `{spacing.section}` (96px) between bands; `{spacing.band}` (128px) on hero and footer.
- Card internal padding: `{spacing.xxl}` (32px) on feature cards; `{spacing.xl}` (24px) on compact cards.

### Grid & Container
- **Max content width** ≈ 1200px centred.
- **Feature grid**: 3 columns at desktop (≥1024px), 2 at tablet (768–1023px), 1 at mobile (<768px).
- **Stat cards**: 4-up at desktop, 2-up at tablet, 1-up at mobile.
- **Code-story splits**: 2-up (narrative left, code right) at desktop, stacked at tablet.
- Hero spans full viewport width with content centred in 1200px column.

### Whitespace Philosophy
Dark chrome benefits from generous spacing — the neon glows need room to breathe and bleed without colliding. Sections gap at 96–128px. Cards gap at 24–32px. Inside cards, padding stays at 32px for feature content, 24px for compact content. The spacing rhythm is 8px-based throughout, creating visual consistency across the system.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — flat | `{colors.canvas}` + `{colors.chrome-border}` | Default page, full-bleed bands. |
| 1 — chrome | `{colors.surface-chrome}` + `{colors.chrome-border}` + 1px | Feature cards, standard containers. |
| 2 — raised | `{colors.surface-raised}` + `{colors.chrome-border-strong}` + 1px | Elevated panels, stat cards, dropdowns. |
| 3 — overlay | `{colors.surface-overlay}` + `{glow.sm}` cyan + 1px neon | Modals, popovers, floating panels. |
| 4 — neon glow | Multi-layer `box-shadow` spread | Active cards, focused inputs, hero elements. |

### Glow Depth System
Depth in this system is **glow intensity**, not shadow:

| Glow Level | Shadow | Use |
|---|---|---|
| `{glow.sm}` | `0 0 6px` | Subtle accent, small badges, inline indicators. |
| `{glow.md}` | `0 0 12px` | Active input focus, hover states on cards. |
| `{glow.lg}` | `0 0 20px` | Primary CTA, active card borders, section highlights. |
| `{glow.xl}` | `0 0 32px` | Hero element glow, featured content, maximum emphasis. |
| `{glow.spread-sm}` | `0 0 6px, 0 0 12px` | Neon-bordered cards at rest. |
| `{glow.spread-md}` | `0 0 8px, 0 0 20px, 0 0 40px` | Neon-bordered cards in active/hover state. |
| `{glow.spread-lg}` | `0 0 12px, 0 0 24px, 0 0 48px, 0 0 80px` | Hero-level maximum glow spread. |

Every neon-bordered component combines a `border` with a `box-shadow` glow. The border provides the sharp edge; the shadow provides the ambient bleed. The inset shadow variant (`inset 0 0 12px`) adds an inner glow for filled surfaces and badges.

### Decorative Depth
- **Hero atmospheric glow** — a large radial gradient behind the hero headline, using `{colors.primary-glow-wide}` at 15% opacity, spreading 400–600px. Creates an ambient cyan pool behind the title.
- **Section divider glow** — a horizontal 1px line using `{colors.primary}` with `{glow.sm}` glow, placed between major sections. Replaces traditional `<hr>` with a glowing accent.
- **Card hover bloom** — on hover, a card's border glow intensifies from `{glow.spread-sm}` to `{glow.spread-md}`, creating a "bloom" effect as the neon light bleeds further into the surrounding chrome.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Hero band, full-bleed sections, nav bar. |
| `{rounded.xs}` | 4px | Inline code tags, small indicators. |
| `{rounded.sm}` | 6px | Form inputs, compact badges. |
| `{rounded.md}` | 8px | Buttons, code blocks, standard containers. |
| `{rounded.lg}` | 12px | Feature cards, stat cards, modals. |
| `{rounded.xl}` | 16px | Large feature panels, hero cards. |
| `{rounded.full}` | 9999px | Pills, status dots, avatar circles. |

### Photography Geometry
- Photography is rare in this system. When present, images sit inside `{rounded.lg}` containers with a neon border glow, framed like holographic displays on the dark chrome.
- Avatar circles use `{rounded.full}` at 32–40px with a cyan or magenta border glow.

## Components

### Buttons

**`button-neon-cyan`** — primary neon CTA
- Transparent background, `{colors.primary}` 1px border, `{colors.primary}` text, `{typography.button-md}`, `{rounded.md}`, padding `10px 24px`.
- Box-shadow: `{glow.spread-md}` with cyan glow + inset cyan wash.
- Hover: intensifies to `{glow.spread-lg}`.

**`button-neon-magenta`** — secondary neon CTA
- Transparent background, `{colors.magenta}` 1px border, `{colors.magenta}` text, same shape.
- Box-shadow: `{glow.spread-md}` with magenta glow.

**`button-neon-filled`** — filled neon CTA
- `{colors.primary}` background, `{colors.primary-on}` text, `{colors.primary}` border.
- Box-shadow: `{glow.spread-lg}` — maximum glow for the most important action per viewport.

**`button-ghost`** — neutral chrome CTA
- Transparent background, `{colors.chrome-border-strong}` border, `{colors.ink}` text.
- No glow — used for low-emphasis secondary actions.

### Cards

**`card-neon`** — primary neon card
- `{colors.surface-chrome}` background, `{colors.primary}` 1px border, `{glow.spread-sm}` cyan glow + inset cyan wash.
- Used for featured content, active states, primary feature highlights.

**`card-neon-magenta`** — secondary neon card
- Same as `card-neon` but with magenta border and glow. Used for secondary emphasis, error-related cards.

**`card-neon-acid`** — success neon card
- Same structure with acid-green border and glow. Used for success states, positive metrics.

**`card-chrome`** — default chrome card
- `{colors.surface-chrome}` background, `{colors.chrome-border}` 1px border, no glow. Dormant state.

**`card-chrome-raised`** — elevated chrome card
- `{colors.surface-raised}` background, `{colors.chrome-border-strong}` border, no glow. Used for stat cards, elevated content.

### Inputs

**`input-neon`** — text input at rest
- `{colors.surface-deep}` background, `{colors.chrome-border-strong}` 1px border, `{typography.body-md}`, `{rounded.sm}`, padding `12px 16px`.
- Focus state: border shifts to `{colors.primary}`, `{glow.sm}` cyan glow appears.

**`input-neon-focused`** — text input focused
- Same as `input-neon` with `{colors.primary}` border and `{glow.sm}` cyan glow.

**`textarea-neon`** — textarea variant
- Same as `input-neon` but with `{rounded.md}`, `{spacing.lg}` padding, 120px min-height.
- Focus state uses magenta instead of cyan for visual variety.

### Navigation

**`nav-bar`** — top navigation
- `rgba(10,10,15,0.85)` background with `backdrop-filter: blur(16px)`, `{colors.chrome-border}` 1px bottom border, 64px height.
- Logo left, nav center, CTA right. Translucent chrome with blur creates a frosted-glass effect over the dark canvas.

### Hero

**`hero-band`** — full-viewport hero
- `{colors.canvas}` background, `{typography.display-xxl}` headline, 120px top / 96px bottom padding.
- Contains a single radial atmospheric glow using `{colors.primary-glow-wide}` at 15% opacity, positioned behind the headline.
- One `{button-neon-filled}` CTA maximum per hero.

### Badges & Pills

**`badge-neon`** — cyan pill badge
- `rgba(0,240,255,0.1)` background, `{colors.primary}` 1px border, `{colors.primary}` text, `{typography.label}`, `{rounded.full}`.
- Inner glow: `inset 0 0 8px {colors.primary-glow-wide}`.

**`badge-neon-magenta`** — magenta pill badge
- Same structure with magenta colours and glow.

### Code

**`code-block`** — code display well
- `{colors.surface-deep}` background, `{colors.chrome-border}` 1px border, `{typography.code-md}`, `{rounded.md}`, 24px padding.
- Scrollable horizontally. No line numbers by default (add via component variant if needed).

### Footer

**`footer`** — global footer
- `{colors.surface-deep}` background, `{colors.chrome-border}` 1px top border, `{colors.ink-muted}` text, `{typography.body-sm}`, padding `64px 32px 32px`.
- Multi-column link grid above a single-line copyright row.

## Do's and Don'ts

### Do
- Use `{colors.canvas}` (`#0a0a0f`) as the default page background. Never pure `#000000` — the subtle blue-black is the chrome identity.
- Pair every interactive element with a 1px neon border and matching `box-shadow` glow. The glow IS the depth.
- Use `{glow.spread-sm}` at rest, `{glow.spread-md}` on hover/active, `{glow.spread-lg}` for hero emphasis.
- Set display headlines in Inter 800 with negative tracking and line-height below 1.0.
- Use `{typography.label}` (uppercase, 11px, 1.5px spacing) for section eyebrow text — it creates hierarchy against tight display type.
- Reserve `{button-neon-filled}` (filled cyan) as the single brightest element per viewport — one maximum.
- Build card hierarchy through glow intensity, not background colour shifts.
- Use `{colors.ink}` (`#e8eaed`) for primary text — the slight warmth reduces eye strain vs pure white.

### Don't
- Don't use drop shadows anywhere. All depth is glow-based (`box-shadow` with colour).
- Don't use pure `#000000` as a background — the chrome undertone in `#0a0a0f` is intentional.
- Don't place two maximum-glow (`{glow.spread-lg}`) elements in the same viewport — they compete.
- Don't use neon colours as solid background fills (except `{button-neon-filled}`). Neon is for borders and glow only.
- Don't bump body text above 400 weight. Emphasis comes from neon colour, not weight.
- Don't tighten body line-height below 1.5 — readability on dark chrome requires breathing room.
- Don't use `{rounded.full}` on cards or buttons. The system's button shape is `{rounded.md}` (8px), not pill.
- Don't mix neon colours on a single element. One border, one glow colour per component.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Desktop XL | ≥ 1440px | Full max-width 1200px, 3-up feature grid, side-by-side code-story. |
| Desktop | 1024–1439px | Default layout, 3-up grid, hero at 80px display. |
| Tablet | 768–1023px | Feature grid 2-up, code-story stacks, hero clamps to 56px. |
| Mobile Large | 426–767px | Feature grid 1-up, hero clamps to 40px, nav collapses to hamburger. |
| Mobile | ≤ 425px | All grids 1-up, hero clamps to 32px, section padding collapses to 64px. |

### Touch Targets
- All buttons ship at minimum 40px height on desktop, scaling to 44px on mobile via padding.
- Form inputs stay at 44px minimum height across all breakpoints.
- Badge pills scale from 36px to 40px on mobile.

### Collapsing Strategy
- Display tiers stair-step: 80 → 64 → 56 → 40 → 32px across the breakpoint ladder.
- Feature grid: 3-up → 2-up → 1-up.
- Stat cards: 4-up → 2-up → 1-up.
- Code-story splits switch from side-by-side to stacked at <1024px.
- Neon glow intensities stay constant across breakpoints — the glow is the system's identity regardless of screen size.
- Nav collapses to hamburger below 1024px; frosted-glass effect remains.

### Image Behavior
- Hero atmospheric glow is CSS radial gradient — no asset cost, scales with viewport.
- Neon glow on cards is CSS `box-shadow` — scales naturally.
- Photography, when present, uses `srcset` for responsive crops inside `{rounded.lg}` neon-bordered containers.

## Iteration Guide

1. Focus on ONE component at a time. Start with `card-neon` — it establishes the chrome + glow vocabulary.
2. Reference component names and tokens directly (`{colors.primary}`, `{glow.spread-md}`, `{rounded.lg}`) — do not paraphrase.
3. Test glow visibility on the actual dark chrome background — neon glows look different on `#0a0a0f` vs `#000000`.
4. Keep one filled CTA (`{button-neon-filled}`) per viewport maximum — more than one dilutes the glow hierarchy.
5. Use the glow intensity ladder: `sm` → `md` → `lg` → `xl` to communicate importance, not colour variety.
6. Default body to `{typography.body-md}`; reserve `{typography.body-lg}` for marketing lead paragraphs only.
7. Neon borders must always pair with matching `box-shadow` glow — a bare neon border without glow reads as flat, not chrome.
