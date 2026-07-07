# BlinkEdge — Judge Demo Script

> **Track:** Prediction Markets and Settlement (TxODDS)
> **Live:** [https://blinkedge.onrender.com](https://blinkedge.onrender.com)
> **Blinks Inspector:** [https://dial.to/developer?url=https://blinkedge.onrender.com/api/actions/hedge/wc-2026-final](https://dial.to/developer?url=https://blinkedge.onrender.com/api/actions/hedge/wc-2026-final)

A 4-minute walkthrough that exercises every judging axis: **Fan UX**, **Technical Complexity**, **Solana Use**.

---

## 0. Before you start (30s)

- Open [https://blinkedge.onrender.com](https://blinkedge.onrender.com) on a **mobile device** or in a desktop browser with webcam access.
- Have a mobile Solana wallet ready (Phantom or Solflare, switched to **Devnet**).
  - Phantom → Settings → Developer → Testnet (Phantom calls it "Testnet", same as Devnet RPC).
- Keep this script open on a second screen.

> The app runs on a 90-second mock match loop. Score, odds, and events update every 2 seconds. You'll see a **red-card risk alert** fire at minute 67 and an **odds-swing alert** at minute 22 (90-second cycle). If you miss one, wait for the loop to wrap.

---

## 1. AR HUD — Fan UX (60s)

**What to show:** the camera-as-canvas concept and translucent HUD widgets.

1. On first load, tap **"Enable Camera"** and grant permission.
2. The rear camera feed fills the viewport. Three neon HUD widgets float over it:
   - **Top-center (cyan):** Scoreboard — `BRA 0 - 0 ARG · 0' LIVE`
   - **Right-edge (magenta):** Odds Matrix — `1.50 / 2.80 / 1.50`
   - **Bottom-center (acid green):** Consensus — `DRAW 50% · POS 50%`
3. Point the camera at any TV / monitor showing a match (or just look around).
4. **Say:** _"The broadcast stays visible through the HUD. No context switch, no second screen."_

**Judging hook:** depth comes from glow, not drop-shadows — the chrome stays readable over a bright TV without obscuring it.

---

## 2. Live Risk Engine — Technical Complexity (60s)

**What to show:** the rule-based risk detection firing on real packet deltas.

1. Watch the minute counter climb (it ticks every 2 seconds of real time).
2. **Around minute 22** the Odds Matrix will jump (swings >18% on one side) — a **bottom sheet** slides up:
   - _"high Risk — Odds swung 91% on away at minute 22. Market sentiment shift."_
   - Amber glow, **"Hedge Now"** button.
3. Tap **dismiss** (✕) if you want to keep watching the HUD.
4. **Around minute 67** a red-card event triggers a **critical** alert: magenta glow, same sheet.
5. **Say:** _"The engine is a pure reducer: `evaluate(prevPacket, curPacket) → RiskAssessment[]`. Four declarative rules — red card, injury, odds swing, lead reversal. No React coupling, fully unit-tested."_

**Judging hook:** rules are additive — drop a new rule into the `rules[]` array, no refactor. 36 tests cover the edge cases (boundary thresholds, duplicates, simultaneous fires).

---

## 3. One-tap Solana Blink — Solana Use (90s)

**What to show:** the full Action lifecycle — `GET` metadata, `POST` transaction, wallet sign, confirmed.

### 3a. Validate the Action with Blinks Inspector (30s)

1. Open [https://dial.to/developer?url=https://blinkedge.onrender.com/api/actions/hedge/wc-2026-final](https://dial.to/developer?url=https://blinkedge.onrender.com/api/actions/hedge/wc-2026-final)
2. You'll see:
   - Title: **Blink Hedge — Devnet**
   - Description: _"Protect your capital with one tap…"_
   - Icon: the BlinkEdge "B" badge
3. **Say:** _"`actions.json` at the root declares the route. CORS is wide-open for wallet discovery."_

### 3b. Execute the hedge in-app (60s)

1. Back in the app, wait for any risk alert (minute 22 or 67).
2. Tap **"Hedge Now"** → the **BlinkHedgeCard** modal opens (amber, "MOCK HEDGE" → "Hedge Available" → "Hedge Now").
3. Tap **"Hedge Now"** inside the modal → it fetches Action metadata (`GET`), displays label and description.
4. Tap **"Confirm in Wallet"** → Phantom/Solflare prompts you to sign a transaction on **Devnet**.
5. Approve in the wallet → the modal flips to green: **"✓ Hedged"**.
6. **Say:** _"That was a real Solana Action. The `POST` built a transaction with a priority fee set from the median of recent fees × 2 — never zero. `autoConnect: false` means we never accidentally hit mainnet."_

**Judging hook:** visible **devnet cluster badge** + truncated pubkey. No ambiguity about which chain you signed on. The `links.next` callback returns `"Hedged ✓"` — full Action lifecycle.

---

## 4. What's Devnet-only (be transparent)

Be upfront with judges — this is a hackathon, not production:

- **Mock TxLINE stream:** 2-second tick, deterministic PRNG, 90-second match loop. Real TxODDS API needs their SDK + auth (we have a Telegram channel contact: @TxLINEChat).
- **"Hedge voucher" is a SystemProgram transfer** of 1000 lamports to a fixed devnet address — an on-chain breadcrumb, not a real SPL mint. The Action shape is identical to a production hedge; only the inner instruction differs.
- **No mobile-wallet-adapter deep-link:** the in-app wallet button uses standard wallet-adapter `sendTransaction`. MWA deep-link is the one Phase-3b task we cut for time.

---

## 5. Quickhooks for Q&A

| Question | Answer |
|----------|--------|
| "How is this different from a sportsbook app?" | Sportsbook makes you leave the broadcast. BlinkEdge's HUD sits *on top* of the broadcast — zero context switch. |
| "Why Solana for a hedge?" | One-tap Actions + sub-second confirmation. Ethereum's UX is worse for a 67th-minute red card. |
| "Is the risk engine real?" | Yes — pure reducer, 4 rules, 36 unit tests, fully decoupled from React. Drop a new rule into `rules[]`, no refactor. |
| "What's real on-chain?" | The Action endpoint returns a real base64 transaction, the wallet signs it, the priority fee is fetched live. Only the inner instruction (SystemProgram transfer vs real SPL hedge) is mocked. |
| "How would you productionize?" | Replace `mockData.ts` with TxODDS API (same `TxLineSource` interface), swap SystemProgram transfer for an SPL vault instruction, add MWA deep-link for true one-tap mobile. |
| "Why the camera?" | The fan is already watching TV. Putting odds over the broadcast beats a second-screen app they have to refresh. |

---

## 6. Reproducibility — if a judge wants to run it

```bash
git clone https://github.com/msourial/BlinkEdge.git
cd BlinkEdge
npm install
npm run dev          # http://localhost:3000
npm test            # 48 tests, ~400ms
npm run build       # production build
```

**Deploy:** `render.yaml` is in the repo root. Render auto-deploys from `main` on every push.

---

## 7. Endpoints cheat sheet

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Camera HUD app (PWA, installable) |
| `GET` | `/actions.json` | Solana Actions discovery |
| `GET` | `/api/actions/hedge/[marketId]` | Action metadata (title, icon, label) |
| `POST` | `/api/actions/hedge/[marketId]` | Returns base64 tx for given `account` |
| `OPTIONS` | `/api/actions/hedge/[marketId]` | CORS preflight (200 + `Access-Control-Allow-Origin: *`) |
| `GET` | `/manifest.webmanifest` | PWA manifest |

---

## 8. File map for code review

```
lib/risk/riskEngine.ts                    ← 4 pure rules
lib/risk/riskEngine.test.ts               ← 22 unit tests
lib/risk/RiskEngineProvider.tsx           ← subscriber (1px React glue)
lib/schema/txLineSchema.ts                ← Zod schema (14 tests)
lib/solana/SolanaTransactionService.ts    ← tx builder + devnet RPC
lib/txline/mockData.ts                    ← deterministic PRNG + 2s tick
lib/txline/mockData.test.ts               ← 12 unit tests
app/api/actions/hedge/[marketId]/route.ts ← GET + POST handlers
app/actions.json/route.ts                ← discovery
app/components/BlinkHedgeCard.tsx         ← Action client (GET → POST → sign → confirmed)
app/components/RiskAlertSheet.tsx         ← z-30 bottom sheet
app/components/WalletProvider.tsx         ← autoConnect:false
```

---

**Total time: 4 minutes.** Lean on the AR HUD video for the wow factor, then close on the wallet confirmation. That's the full story.