---
last_mapped_commit: pre-init
mapped_at: 2026-07-06
focus: quality
---

# Codebase Testing

## Current State

**Status:** Pre-initialization — no application code or tests exist yet.

## Planned Testing Strategy (Phase 1+)

### Framework
- **Vitest** — Fast unit testing, native ESM, good Next.js integration
- **React Testing Library** — Component testing
- **@testing-library/jest-dom** — DOM assertions

### Test Structure (planned)
```
__tests__/
├── unit/
│   ├── txline/
│   │   ├── TxLineProvider.test.tsx
│   │   └── mockData.test.ts
│   └── schema/
│       └── txLineSchema.test.ts
├── component/
│   ├── Scoreboard.test.tsx
│   ├── OddsMatrix.test.tsx
│   └── ConsensusIndicator.test.tsx
└── integration/
    └── CameraPermissionGate.test.tsx
```

### Phase 1 Testing Focus

1. **Zod schema validation** — TxLineEventPacket accepts valid data, rejects invalid
2. **Mock data determinism** — Same seed produces same event sequence
3. **TxLineProvider** — Tick events propagate to consumers
4. **HUD widget rendering** — Correct data displays in correct widget
5. **Camera permission flow** — Gate shows/hides based on permission state

### Mocking Strategy

- **Camera API:** Mock `navigator.mediaDevices.getUserMedia` in tests
- **Permissions API:** Mock `navigator.permissions.query`
- **Time:** Use `vi.useFakeTimers()` for deterministic 2000ms tick testing

### Coverage Target

- **Phase 1:** 80%+ coverage on `lib/txline/` and `lib/schema/`
- **Components:** Render tests for all 5 components
- **Integration:** Camera permission flow end-to-end

## Commands (planned)

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

---
*Last updated: 2026-07-06 — pre-initialization scan*
