---
last_mapped_commit: pre-init
mapped_at: 2026-07-06
focus: tech
---

# Codebase Integrations

## Current State

**Status:** Pre-initialization — no integrations implemented yet.

## Planned Integrations

### Phase 1 (Mock)
- **In-memory TxLineProvider** — Simulates TxLINE data stream with deterministic 2000ms tick
- **Web Media API (Camera)** — `navigator.mediaDevices.getUserMedia` for rear-camera access
- **Permissions API** — `navigator.permissions.query({ name: 'camera' })` for permission state

### Phase 2+ (Future)
- **TxLINE on Solana** — Live World Cup match data stream
  - WebSocket or HTTP polling (TBD during Phase 2 planning)
  - Data shape: `TxLineEventPacket` (defined in ZOD_SCHEMAS.md)
- **Solana wallet adapter** — For Blink transactions

### Phase 3+ (Future)
- **TxEdge AI Agent** — Risk detection engine
  - Listens to TxLINE stream
  - Detects red cards, injuries, critical events
  - Triggers hedge prompts
- **Solana Blinks** — Action prompts for hedge execution
  - `GET /api/bblink/hedge` → Blink metadata
  - `POST /api/bblink/hedge` → Execute transaction

## Camera API Constraints

| Platform | Requirement | Behavior |
|----------|-------------|----------|
| iOS Safari 15+ | HTTPS or localhost | `facingMode: 'environment'` supported, prompts per-session |
| Android Chrome | HTTPS or localhost | `facingMode: { ideal: 'environment' }` preferred, persists grant |
| Desktop (testing) | HTTPS or localhost | `facingMode: 'user'` fallback (no rear camera) |

## Environment Variables (planned)

```env
# Phase 2+
TXLINE_ENDPOINT=https://api.txline.solana/...
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_APP_URL=https://blinkedge.app
```

No environment variables needed for Phase 1 (all mock data, no external services).

---
*Last updated: 2026-07-06 — pre-initialization scan*
