---
last_mapped_commit: pre-init
mapped_at: 2026-07-06
focus: arch
---

# Codebase Structure

## Current Directory Layout

```
BlinkEdge/
├── .git/                    # Git repository (initialized)
├── .opencode/               # opencode configuration
└── DESIGN.md               # NeonChrome design specification (32KB)
```

**Note:** No application code exists yet. This is a pre-initialization scan.

## Planned Directory Structure (Phase 1)

```
BlinkEdge/
├── app/
│   ├── layout.tsx           # Root layout, viewport, PWA metadata
│   ├── page.tsx             # Main canvas (camera + HUD)
│   ├── manifest.ts          # PWA manifest route
│   ├── icon.tsx             # PWA icon
│   ├── apple-icon.tsx       # iOS icon
│   └── components/
│       ├── CameraBackdrop.tsx
│       ├── CameraPermissionGate.tsx
│       ├── Scoreboard.tsx
│       ├── OddsMatrix.tsx
│       └── ConsensusIndicator.tsx
├── lib/
│   ├── txline/
│   │   ├── TxLineProvider.tsx
│   │   ├── mockData.ts
│   │   └── types.ts
│   └── schema/
│       └── txLineSchema.ts
├── .planning/               # GSD planning docs
│   └── codebase/            # This codebase map
├── public/                  # Static assets (icons if not using dynamic)
├── tailwind.config.ts       # NeonChrome token mapping
├── tsconfig.json
├── package.json
├── next.config.js
└── DESIGN.md                # Design spec (existing, preserved)
```

## Naming Conventions (planned)

- **Components:** PascalCase (`Scoreboard.tsx`, `OddsMatrix.tsx`)
- **Hooks:** camelCase with `use` prefix (`useTxLine.ts`)
- **Schemas:** camelCase (`txLineSchema.ts`)
- **Types:** PascalCase interfaces/types (`TxLineEventPacket`)
- **Constants:** UPPER_SNAKE_CASE
- **Files:** kebab-case for utilities, PascalCase for components

## Key Locations (planned)

| What | Where |
|------|-------|
| Design system spec | `DESIGN.md` (repo root) |
| Tailwind config | `tailwind.config.ts` (repo root) |
| PWA manifest | `app/manifest.ts` |
| Root layout | `app/layout.tsx` |
| Main canvas | `app/page.tsx` |
| HUD components | `app/components/` |
| Data layer | `lib/txline/` |
| Zod schemas | `lib/schema/` |
| Planning docs | `.planning/` |

---
*Last updated: 2026-07-06 — pre-initialization scan*
