---
phase: 3b
name: Devnet Blink Hedge Execution — Action Endpoint + MWA Deep-Link
wave: 2
depends_on: [1]
files_modified:
  - app/api/actions/hedge/[marketId]/route.ts
  - app/actions.json/route.ts
  - lib/solana/SolanaTransactionService.ts
  - lib/solana/hedgeVoucherMint.ts
  - lib/solana/createHedgeTransaction.ts
  - app/components/BlinkHedgeCard.tsx
  - app/components/WalletProvider.tsx
  - app/components/RiskAlertSheet.tsx
  - lib/risk/riskEngine.ts
  - lib/risk/rules.ts
  - lib/risk/types.ts
  - package.json
autonomous: false
requirements:
  - SOL-01
  - SOL-02
  - SOL-03
  - SOL-04
  - SOL-05
  - RISK-01
  - RISK-02
  - RISK-03
  - RISK-04
---

# Phase 3b: Devnet Blink Hedge Execution — Action Endpoint + MWA Deep-Link

## Goal

Ship real devnet Solana settlement: a Solana Blink Action endpoint (`GET` returns metadata, `POST` returns base64 transaction) that lets the fan hedge their position with one tap via Mobile Wallet Adapter (MWA) v2.2.9 deep-link. Triggered by a minimal pure-function risk engine that detects the minute-67 red card from Phase 1's mock data. Devnet "hedge voucher" SPL mint as the demo-safe on-chain breadcrumb. Replaces Phase 1's mock hedge modal with real `signAndSendTransaction`.

**Judging axis:** Solana Ecosystem Use (real Action endpoint, MWA deep-link, devnet SPL mint) + Technical Complexity (pure-function risk reducer)

---

## Context

<files_to_read>
- .planning/research/SUMMARY.md (Architecture Pattern 4: One-Tap Blink Execution, Pattern 3: Pure-Function Risk Engine)
- .planning/research/PITFALLS.md (Pitfall #4: wrong-cluster wallet, Pitfall #5: priority fees)
- .planning/research/ARCHITECTURE.md (BlinkHedgeCard, WalletProvider, SolanaTransactionService design)
- .planning/REQUIREMENTS.md (SOL-01 through SOL-05, RISK-01 through RISK-04)
- design-system/blinkedge/pages/hedge-modal.md (BlinkHedgeCard design, bloom transition, severity mapping)
- design-system/blinkedge/MASTER.md (NeonChrome compliance, Solana checklist)
- .planning/phases/01-walking-skeleton/01-PLAN.md (Phase 1 dependency — mock data, TxLineProvider)
- .claude/skills/coding-standards/SKILL.md (TypeScript strict mode)
- .claude/rules/common/security.md (security best practices)
</files_to_read>

---

## Tasks

### Task 1: Install Solana Packages + Risk Engine Types

**read_first:**
- .planning/research/STACK.md (version pins: web3.js@1.98.4, wallet-adapter-react@0.15.39, actions@1.6.6)
- .planning/research/PITFALLS.md (Pitfall #6: scope creep — NOW allowed, Phase 1 is done)
- .planning/REQUIREMENTS.md (RISK-01 through RISK-04)

**actions:**
1. Install Solana packages:
   ```bash
   npm install @solana/web3.js@1.98.4 \
     @solana/wallet-adapter-react@0.15.39 \
     @solana/wallet-adapter-phantom \
     @solana/wallet-adapter-solflare \
     @solana/actions@1.6.6
   ```
2. `lib/risk/types.ts`: Risk engine types:
   ```typescript
   interface RiskAssessment {
     severity: 'critical' | 'high' | 'medium';
     ruleId: string;
     rationale: string;
     recommendedAction?: string; // Action URL for Blink
     timestamp: number;
   }
   ```
3. Verify: `npm ls @solana/web3.js` shows 1.98.4; no version conflicts

**acceptance_criteria:**
- [ ] `@solana/web3.js@1.98.4`, `@solana/wallet-adapter-react@0.15.39`, `@solana/actions@1.6.6` installed
- [ ] Per-wallet packages (Phantom + Solflare) installed, NOT legacy `@solana/wallet-adapter-wallets` bundle
- [ ] `RiskAssessment` type defined with severity, ruleId, rationale, recommendedAction
- [ ] `npm ls` shows no version conflicts

**verify:** `npm ls @solana/web3.js @solana/actions @solana/wallet-adapter-react`

**requirements:** RISK-03

---

### Task 2: Pure-Function Risk Engine + Declarative Rules

**read_first:**
- .planning/research/SUMMARY.md (Architecture Pattern 3: Pure-Function Risk Engine over Event Diff)
- .planning/research/ARCHITECTURE.md (riskEngine.ts, rules.ts design)
- .planning/REQUIREMENTS.md (RISK-01: pure reducer, RISK-02: ruleset, RISK-04: unit-testable)

**actions:**
1. `lib/risk/rules.ts`: Declarative ruleset array:
   ```typescript
   interface RiskRule {
     id: string;
     evaluate(prev: TxLineEventPacket, cur: TxLineEventPacket, now: number): RiskAssessment | null;
   }
   const rules: RiskRule[] = [
     { id: 'red-card', evaluate: (prev, cur) => {
       const redCard = cur.events.find(e => e.type === 'card' && e.cardType === 'red');
       return redCard ? { severity: 'critical', ruleId: 'red-card', rationale: `Red card at minute ${cur.minute}`, recommendedAction: `/api/actions/hedge/${cur.matchId}`, timestamp: Date.now() } : null;
     }},
     { id: 'injury', evaluate: (prev, cur) => { /* injury detection */ } },
     { id: 'odds-swing', evaluate: (prev, cur) => { /* >18% odds change */ } },
     { id: 'lead-reversal', evaluate: (prev, cur) => { /* score lead flip */ } },
   ];
   ```
2. `lib/risk/riskEngine.ts`: Pure reducer:
   ```typescript
   function evaluate(prev: TxLineEventPacket | null, cur: TxLineEventPacket, now: number): RiskAssessment[] {
     if (!prev) return [];
     return rules.map(r => r.evaluate(prev, cur, now)).filter((a): a is RiskAssessment => a !== null);
   }
   ```
3. NO side effects, NO React imports — fully unit-testable

**acceptance_criteria:**
- [ ] `evaluate(prev, cur, now) → RiskAssessment[]` is a pure function (no side effects)
- [ ] Rules array covers: red card, injury, odds swing (>18%), lead reversal
- [ ] `RiskAssessment` includes severity, ruleId, rationale, recommendedAction (Action URL)
- [ ] Red card rule triggers on minute-67 event from Phase 1 mock data
- [ ] Engine is unit-testable independent of React (no JSX, no hooks)

**verify:** Unit test — fixture packets with red card → `evaluate()` returns critical RiskAssessment with `/api/actions/hedge/{matchId}` URL

**requirements:** RISK-01, RISK-02, RISK-03, RISK-04

---

### Task 3: Solana Action Endpoint (GET + POST)

**read_first:**
- .planning/research/SUMMARY.md (Architecture Pattern 4: One-Tap Blink Execution)
- .planning/research/STACK.md (@solana/actions SDK)
- .planning/REQUIREMENTS.md (SOL-01: GET/POST, SOL-02: actions.json + CORS)

**actions:**
1. `app/api/actions/hedge/[marketId]/route.ts`: Next.js Route Handler
   - `GET`: Return `ActionGetResponse` with metadata (title, description, label, links)
   - `POST`: Accept `{ account }`, build hedge transaction, return `ActionPostResponse` with base64 tx
   - Validate `account` is valid Solana pubkey
   - Set `Access-Control-Allow-Origin: *` headers
2. `app/actions.json/route.ts`: Return `actions.json` ruleset:
   ```json
   {
     "rules": [
       {
         "pathPattern": "/api/actions/hedge/**",
         "apiPath": "/api/actions/hedge/**"
       }
     ]
   }
   ```
   - Set `Access-Control-Allow-Origin: *`
3. POST flow:
   - Decode `account` pubkey
   - Create hedge transaction (transfer devnet SPL "hedge voucher" tokens to user)
   - Set `feePayer = account`, `recentBlockhash` from devnet RPC
   - Add `setComputeUnitPrice` + `setComputeUnitLimit` instructions
   - Serialize + base64 encode
   - Return `{ transaction: base64, message: "Hedge your position" }`

**acceptance_criteria:**
- [ ] `GET /api/actions/hedge/{marketId}` returns valid `ActionGetResponse` JSON
- [ ] `POST /api/actions/hedge/{marketId}` with `{ account }` returns base64 transaction
- [ ] `actions.json` at domain root with `Access-Control-Allow-Origin: *`
- [ ] Transaction includes `setComputeUnitPrice` + `setComputeUnitLimit` instructions
- [ ] `feePayer` set to user's account, `recentBlockhash` from devnet
- [ ] Invalid account pubkey returns 400 error

**verify:** `curl` GET + POST against localhost; Blinks Inspector validation passes

**requirements:** SOL-01, SOL-02

---

### Task 4: SolanaTransactionService + Devnet SPL Mint

**read_first:**
- .planning/research/PITFALLS.md (Pitfall #5: priority fees — setComputeUnitPrice always)
- .planning/research/STACK.md (devnet RPC, Helius/QuickNode)
- design-system/blinkedge/pages/hedge-modal.md (Solana security rules)

**actions:**
1. `lib/solana/hedgeVoucherMint.ts`: Create devnet SPL "hedge voucher" mint:
   - Use `@solana/spl-token` to create mint on devnet
   - Mint authority = server wallet (local keypair, devnet only)
   - This is the demosafe on-chain breadcrumb (no real value)
2. `lib/solana/SolanaTransactionService.ts`:
   ```typescript
   class SolanaTransactionService {
     constructor(private rpc: Connection) {}
     async createHedgeTransaction(account: PublicKey, marketId: string): Promise<string> {
       const { blockhash, lastValidBlockHeight } = await this.rpc.getLatestBlockhash();
       const tx = new Transaction()
         .add(SystemProgram.transfer({ fromPubkey: account, toPubkey: VOUCHER_MINT, lamports: 1000 }))
         .add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: await this.getPriorityFee() }))
         .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }));
       tx.feePayer = account;
       tx.recentBlockhash = blockhash;
       return bs58.encode(tx.serialize({ requireAllSignatures: false }));
     }
     private async getPriorityFee(): Promise<number> {
       const fees = await this.rpc.getRecentPrioritizationFees();
       return Math.median(fees.map(f => f.prioritizationFee)) * 2; // median × 2
     }
   }
   ```
3. `lib/solana/createHedgeTransaction.ts`: Wrapper for route handler
4. Devnet RPC endpoint: `https://api.devnet.solana.com` (or Helius devnet)

**acceptance_criteria:**
- [ ] Devnet SPL "hedge voucher" mint created and funded
- [ ] `SolanaTransactionService` always adds `setComputeUnitPrice` (median × 2)
- [ ] `SolanaTransactionService` always adds `setComputeUnitLimit` (200000)
- [ ] `feePayer` = user account, `recentBlockhash` from devnet
- [ ] `lastValidBlockHeight` = currentBlockHeight + 150 (15s re-sign window)
- [ ] `simulateTransaction` called before returning tx (catch errors early)

**verify:** Devnet explorer — verify mint exists; unit test `createHedgeTransaction` returns valid base64

**requirements:** SOL-03, SOL-05

---

### Task 5: WalletProvider + BlinkHedgeCard

**read_first:**
- .planning/research/ARCHITECTURE.md (WalletProvider, BlinkHedgeCard design)
- .planning/research/PITFALLS.md (Pitfall #4: wrong-cluster wallet auto-connect)
- design-system/blinkedge/pages/hedge-modal.md (component states, bloom transition, severity mapping)

**actions:**
1. `app/components/WalletProvider.tsx`: `'use client'`
   - `@solana/wallet-adapter-react` with `autoConnect: false` (NEVER true)
   - Wallets: Phantom, Solflare (per-wallet packages)
   - Cluster: devnet (derived from Blink URL `?cluster=devnet`)
   - Visible "devnet" badge + truncated pubkey in modal
2. `app/components/BlinkHedgeCard.tsx`: `'use client'`, Action client flow:
   - State machine: idle → loading → metadata → deep-link → pending → confirmed/error
   - `GET /api/actions/hedge/{marketId}` → display hedge details
   - `POST /api/actions/hedge/{marketId}` with `{ account }` → get base64 tx
   - Decode tx, set `feePayer` + `recentBlockhash`
   - `wallet.signAndSendTransaction(tx)` via MWA deep-link
   - `links.next` callback → "Hedged ✓" with acid green `glow-spread-lg`
   - Error: magenta `glow-spread-md` + retry button
3. Wrap app in `<WalletProvider>` (in `app/layout.tsx` or `app/page.tsx`)
4. Bloom transition: `spread-sm` → `spread-lg` (400ms, `power2.inOut`) on hedge trigger

**acceptance_criteria:**
- [ ] `autoConnect: false` — never auto-reconnects stale wallet
- [ ] "devnet" cluster badge visible + truncated pubkey
- [ ] GET metadata → POST {account} → MWA deep-link → `links.next` "Hedged ✓"
- [ ] Bloom transition: `spread-sm` → `spread-lg` (hero max, ONE per viewport)
- [ ] Error state: magenta glow + retry, never silent fail
- [ ] `prefers-reduced-motion: reduce` → skip bloom, instant state change

**verify:** Phantom/Solflare devnet — full flow: GET → POST → deep-link → signature confirmed → "Hedged ✓"

**requirements:** SOL-04

---

### Task 6: RiskAlertSheet + Risk Engine Integration

**read_first:**
- design-system/blinkedge/pages/hedge-modal.md (RiskAlertSheet z-30, severity color mapping)
- .planning/research/ARCHITECTURE.md (RiskEngineProvider, RiskAlertSheet)
- .planning/phases/01-walking-skeleton/01-PLAN.md (Task 10: mock hedge modal placeholder — REPLACE this)

**actions:**
1. `app/components/RiskAlertSheet.tsx`: `'use client'`, z-30 bottom-sheet
   - Slide-up entrance: `translateY(100%) → 0` (300ms, `power2.out`)
   - Displays: severity icon, risk rationale, "Hedge now" CTA
   - Severity color mapping: critical=magenta, high=amber, medium=amber-sm
2. Integrate risk engine into `TxLineProvider` or create `RiskEngineProvider`:
   - On each new packet: call `evaluate(prev, cur, now)`
   - If `RiskAssessment[]` non-empty: show `RiskAlertSheet`
   - "Hedge now" CTA → mount `BlinkHedgeCard` (z-40)
3. **Replace Phase 1 mock hedge modal** (Task 10) with real `RiskAlertSheet` + `BlinkHedgeCard`
4. Wire: minute-67 red card → `evaluate()` returns critical → `RiskAlertSheet` appears → "Hedge now" → `BlinkHedgeCard` → MWA deep-link → "Hedged ✓"

**acceptance_criteria:**
- [ ] `RiskAlertSheet` appears when `evaluate()` returns non-empty `RiskAssessment[]`
- [ ] Severity color mapping: critical=magenta, high=amber, medium=amber-sm
- [ ] "Hedge now" CTA → `BlinkHedgeCard` mounts (z-40)
- [ ] Phase 1 mock hedge modal replaced with real flow
- [ ] Minute-67 red card triggers full chain: alert → hedge → deep-link → confirmed
- [ ] `prefers-reduced-motion: reduce` → skip slide-up, instant appear

**verify:** Run dev server, fast-forward mock to minute 67, verify full hedge flow executes on devnet

**requirements:** RISK-01, SOL-04

---

### Task 7: Blinks Inspector Validation + Cluster Safety

**read_first:**
- .planning/research/STACK.md (Blinks Inspector tool)
- .planning/research/PITFALLS.md (Pitfall #4: wrong-cluster)
- design-system/blinkedge/MASTER.md (Solana Pre-Delivery Checklist)

**actions:**
1. Validate Action endpoint with Blinks Inspector (https://blinks.xyz or local):
   - GET returns valid `ActionGetResponse`
   - POST returns valid `ActionPostResponse` with base64 tx
   - `actions.json` resolves correctly
2. Verify cluster safety:
   - `autoConnect: false` confirmed in `WalletProvider`
   - "devnet" badge visible in `BlinkHedgeCard`
   - `simulateTransaction` called before `signAndSendTransaction`
   - `setComputeUnitPrice` always present
3. Run Solana Pre-Delivery Checklist from `design-system/blinkedge/MASTER.md`

**acceptance_criteria:**
- [ ] Blinks Inspector validates GET + POST endpoints
- [ ] `actions.json` returns valid ruleset with CORS `*`
- [ ] `autoConnect: false` (grep to verify)
- [ ] "devnet" badge visible in UI
- [ ] `simulateTransaction` before `signAndSendTransaction`
- [ ] `setComputeUnitPrice` in every transaction
- [ ] No mainnet RPC endpoints anywhere (grep for `mainnet` → should be 0)

**verify:** Blinks Inspector UI + `grep -r "mainnet" .` returns nothing; `grep -r "autoConnect" WalletProvider.tsx` shows `false`

**requirements:** SOL-03, SOL-04

---

### Task 8: NeonChrome Compliance + Bloom Transition Polish

**read_first:**
- design-system/blinkedge/MASTER.md (Pre-Delivery Checklist, Anti-Patterns)
- design-system/blinkedge/pages/hedge-modal.md (bloom transition spec)
- DESIGN.md (glow system, component specs)

**actions:**
1. Verify NeonChrome compliance on all new components:
   - No pure `#000000` (grep)
   - No drop shadows (all glow)
   - Max 1 `spread-lg` per viewport (during hedge bloom)
   - No neon as solid background fill
   - All body text weight ≤ 400
   - `rounded.lg` on cards, `rounded.md` on buttons
2. Polish bloom transition:
   - `RiskAlertSheet` appear: `spread-sm` (rest)
   - "Hedge now" hover: `spread-md`
   - `BlinkHedgeCard` mount: `spread-lg` bloom (400ms, `power2.inOut`)
   - "Hedged ✓" success: acid green `spread-lg`
3. Text legibility: `text-shadow: 0 0 4px rgba(10,10,15,0.9)` on all modal text
4. Touch targets: all buttons ≥ 44px

**acceptance_criteria:**
- [ ] No pure `#000000` in new components (grep)
- [ ] Bloom transition: `spread-sm` → `spread-md` → `spread-lg` (400ms)
- [ ] Success state: acid green `spread-lg` (ONE max-glow per viewport)
- [ ] All modal text has `text-shadow` halo
- [ ] All buttons ≥ 44px height
- [ ] `prefers-reduced-motion: reduce` → instant state changes, no bloom

**verify:** Visual inspection of full hedge flow; `grep -r "#000000" app/ lib/`

**requirements:** DSGN-03, DSGN-04

---

## Verification Criteria

### Functional
- [ ] `GET /api/actions/hedge/{marketId}` returns valid `ActionGetResponse`
- [ ] `POST /api/actions/hedge/{marketId}` returns base64 transaction
- [ ] `actions.json` at root with CORS `*`
- [ ] MWA deep-link: `signAndSendTransaction` works on Phantom + Solflare
- [ ] `links.next` callback renders "Hedged ✓"
- [ ] Risk engine detects minute-67 red card → triggers full hedge flow
- [ ] Devnet "hedge voucher" SPL mint created and transferable

### Security
- [ ] `autoConnect: false` (NEVER auto-reconnect)
- [ ] "devnet" cluster badge visible
- [ ] `simulateTransaction` before `signAndSendTransaction`
- [ ] `setComputeUnitPrice` always (median × 2)
- [ ] `setComputeUnitLimit` always (200000)
- [ ] No mainnet RPC endpoints (grep)
- [ ] No real wallet funds (devnet only)

### Design
- [ ] Bloom transition: `spread-sm` → `spread-lg` (400ms)
- [ ] Success: acid green `spread-lg`
- [ ] Error: magenta `spread-md` + retry
- [ ] No pure `#000000`, no drop shadows
- [ ] `prefers-reduced-motion` respected

### Blinks Spec
- [ ] Blinks Inspector validates endpoints
- [ ] `ActionGetResponse` / `ActionPostResponse` schema correct
- [ ] `actions.json` ruleset valid
- [ ] CORS `*` on all Action routes

---

## must_haves

### truths (goal-backward verification)
- `GET /api/actions/hedge/{marketId}` returns valid `ActionGetResponse` with metadata
- `POST /api/actions/hedge/{marketId}` with `{ account }` returns base64 transaction
- `actions.json` returns valid ruleset with `Access-Control-Allow-Origin: *`
- Transaction includes `setComputeUnitPrice` + `setComputeUnitLimit`
- `feePayer` = user account, `recentBlockhash` from devnet
- MWA `signAndSendTransaction` deep-link works (Phantom + Solflare)
- `links.next` callback renders "Hedged ✓"
- Risk engine `evaluate(prev, cur, now)` is pure (no side effects)
- Red card at minute 67 triggers `RiskAssessment` with `recommendedAction` URL
- `autoConnect: false` on WalletProvider

### held-out (property-based / non-inferable)
- `autoConnect: false` enforced (grep-verifiable, not runtime)
- No mainnet RPC endpoints (grep-verifiable)
- `setComputeUnitPrice` always present (transaction inspection)
- `simulateTransaction` before send (runtime flow)

---

## Threat Model

### Wrong-Cluster Wallet (SOL-03)
- **Risk:** `autoConnect: true` re-establishes stale wallet against wrong RPC; user signs real USDC on mainnet when devnet intended
- **Mitigation:** `autoConnect: false`; cluster derived from Blink URL `?cluster=devnet`; visible "devnet" badge; `simulateTransaction` before send
- **Severity:** HIGH — could sign real-value transactions on wrong cluster
- **ASVS:** L1 (session management, transaction validation)

### Priority Fee Omission (SOL-03)
- **Risk:** Transaction without `setComputeUnitPrice` sits in mempool 60-90s and gets dropped; "one-tap hedge" UX dies
- **Mitigation:** `setComputeUnitPrice` (median × 2 from `getRecentPrioritizationFees`) + `setComputeUnitLimit` (200000); 15s re-sign with 1.5× fee
- **Severity:** Medium (UX failure, not security — but demo-critical)

### Mock Hedge Modal Left In (Scope Creep)
- **Risk:** If Phase 1 mock hedge modal (Task 10) isn't replaced, judges see "MOCK HEDGE" badge instead of real Solana settlement
- **Mitigation:** Task 6 explicitly replaces mock modal with real `RiskAlertSheet` + `BlinkHedgeCard`; verify no "MOCK HEDGE" badge remains
- **Severity:** Low (judging perception, not security)

---

## Dependencies

- **Phase 1 complete** (mock TxLineProvider, red card at minute 67, app shell, HUD widgets)
- **@solana/web3.js@1.98.4** + **@solana/wallet-adapter-react@0.15.39** + **@solana/actions@1.6.6**
- Per-wallet packages: `@solana/wallet-adapter-phantom`, `@solana/wallet-adapter-solflare`
- Devnet RPC endpoint (Helius or public `api.devnet.solana.com`)
- Blinks Inspector (https://blinks.xyz) for spec validation

---

## Estimated Time

~6 hours (2h/day × 3 days)

| Task | Hours |
|------|-------|
| 1. Install + Risk Types | 0.5 |
| 2. Risk Engine + Rules | 1 |
| 3. Action Endpoint (GET/POST) | 1 |
| 4. TransactionService + SPL Mint | 1 |
| 5. WalletProvider + BlinkHedgeCard | 1.5 |
| 6. RiskAlertSheet + Integration | 0.5 |
| 7. Blinks Inspector + Cluster Safety | 0.25 |
| 8. NeonChrome Compliance + Polish | 0.25 |
| **Total** | **6** |
