# Hedge Modal Page Overrides — BlinkEdge

> **PROJECT:** BlinkEdge
> **Page:** Hedge Modal / BlinkHedgeCard (`app/components/BlinkHedgeCard.tsx`)
> **Generated:** 2026-07-06
> **Source:** DESIGN.md + research/SUMMARY.md + research/PITFALLS.md

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/blinkedge/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout — Risk-to-Blink Bloom Transition

The hedge modal appears when the TxEdge risk engine detects a critical event (Phase 3a: red card at minute 67 from mock data). The transition from HUD rest state to hedge modal is the **hero UX moment** for judges.

```
Rest State (z-20 HUDs)  →  Risk Detected (z-30 RiskAlertSheet)  →  Hedge Now CTA  →  BlinkHedgeCard (z-40)
```

### Modal Overrides

- **Background:** `rgba(10,10,15,0.85)` (more opaque than HUD — modal needs foreground legibility)
- **Border:** 1px solid `var(--color-amber)` (warning state — amber `#ffb800`)
- **Backdrop:** `backdrop-filter: blur(16px)` on modal overlay (counts toward 3-blur budget — hide a HUD widget if needed)
- **Border radius:** `rounded.lg` (12px) — never `rounded.full`
- **Box-shadow:** `var(--glow-spread-md)` with amber glow

### Severity Color Mapping

| Severity | Border Color | Glow | Action |
|----------|-------------|------|--------|
| Critical (red card, injury) | `var(--color-magenta)` `#ff00e5` | `glow-spread-md` magenta | "Hedge now" CTA |
| High (odds swing >18%) | `var(--color-amber)` `#ffb800` | `glow-spread-md` amber | "Hedge now" CTA |
| Medium (lead reversal) | `var(--color-amber)` `#ffb800` | `glow-sm` amber | Dismissible alert |

### BlinkHedgeCard Component

**States:**
1. **Idle:** Not rendered (risk not detected)
2. **Risk detected:** RiskAlertSheet appears (z-30) with severity + rationale + "Hedge now" CTA
3. **Loading:** "Connecting to devnet…" with amber spinner
4. **Action metadata fetched:** Display hedge details (market, stake, potential return)
5. **Wallet deep-link:** MWA `signAndSendTransaction` deep-link triggered
6. **Pending:** "Waiting for wallet signature…" with amber pulse
7. **Confirmed:** `links.next` callback → "Hedged ✓" with acid green glow (`glow-spread-lg`)
8. **Error:** "Transaction failed" with magenta glow, retry option

### Bloom Transition Animation

```css
/* Risk detected → Hedge CTA bloom */
@keyframes bloom {
  0%   { box-shadow: var(--glow-spread-sm); }
  50%  { box-shadow: var(--glow-spread-md); }
  100% { box-shadow: var(--glow-spread-lg); }  /* Hero max — ONE per viewport */
}
.bloom-trigger { animation: bloom 400ms ease-in-out forwards; }
```

**Rules:**
- The `spread-lg` bloom is the ONE max-glow element per viewport during hedge flow
- After confirmation, transition to acid green `spread-lg` (success)
- `prefers-reduced-motion: reduce` → skip bloom, instant state change

### Mock Hedge Fallback (if Phase 3b slips)

If real Solana integration doesn't ship in time, render a mock hedge modal:
- Amber "MOCK HEDGE" badge (top-right of modal)
- "Hedge now" CTA → simulated 2s delay → "Hedged ✓ (mock)" confirmation
- NO wallet connection, NO real transaction
- Clearly labeled as mock for judge transparency

### Solana Security (Phase 3b only)

- **`autoConnect: false`** — never auto-reconnect stale wallet against wrong cluster
- **Visible cluster badge:** "devnet" label + truncated pubkey in top-right of modal
- **`simulateTransaction` before `signAndSendTransaction`** — catch errors before user signs
- **`setComputeUnitPrice` always** — median×2 from `getRecentPrioritizationFees`
- **`setComputeUnitLimit`** — 1.5× devnet-measured
- **`lastValidBlockHeight` = currentBlockHeight + 150** — 15s re-sign window with 1.5× fee
- **Devnet only** — never mainnet in demo

---

## Page-Specific Components

### RiskAlertSheet (z-30)
- Bottom-sheet overlay, `absolute bottom-0 inset-x-0`
- Displays: severity icon, risk rationale, "Hedge now" CTA (button-neon with amber/cyan)
- Slide-up entrance: `transform: translateY(100%) → 0` (300ms, `power2.out`)

### BlinkHedgeCard (z-40)
- Centered modal, `fixed inset-0 flex items-center justify-center`
- Action client flow: GET metadata → POST {account} → decode base64 tx → set feePayer + recentBlockhash → MWA deep-link → `links.next`
- Displays: market name, hedge stake, potential return, cluster badge, "Confirm in wallet" CTA

### WalletProvider
- `@solana/wallet-adapter-react` with `autoConnect: false`
- Phantom + Solflare per-wallet packages (not legacy bundle)
- Cluster derived from Blink URL `?cluster=devnet`
- Visible "devnet" badge + truncated pubkey

---

## Recommendations

- **Effects:** Bloom transition (`spread-sm` → `spread-lg`, 400ms), success glow (acid green `spread-lg`), error glow (magenta `spread-md`)
- **Scrim:** `rgba(10,10,15,0.85)` modal background — strong enough to isolate foreground
- **Touch:** "Hedge now" CTA min 44px height, `touch-action: manipulation`
- **Reduced motion:** Skip bloom animation, instant state change
- **Loading:** Amber spinner during GET/POST/wallet signature (200ms pulse)
- **Error handling:** Magenta glow + retry button on tx failure, never silent fail
