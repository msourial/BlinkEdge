"use client";

import { useState, useEffect } from "react";
import { useTxLine } from "@/lib/txline/TxLineProvider";

type HedgeState = "idle" | "alert" | "loading" | "confirmed";

export function MockHedgeModal() {
  const packet = useTxLine();
  const [state, setState] = useState<HedgeState>("idle");

  useEffect(() => {
    if (packet && packet.minute === 67) {
      const hasRedCard = packet.events.some(
        (e) => e.type === "card" && e.cardType === "red"
      );
      if (hasRedCard && state === "idle") {
        setState("alert");
      }
    }
  }, [packet, state]);

  const handleHedge = () => {
    setState("loading");
    setTimeout(() => setState("confirmed"), 2000);
  };

  const handleDismiss = () => {
    setState("idle");
  };

  if (state === "idle") return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 40,
        backgroundColor: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div
        className="hud-card hud-card-amber relative max-w-sm w-full mx-4"
        style={{
          borderColor: "var(--color-amber)",
          boxShadow:
            "0 0 8px, 0 0 20px, 0 0 40px, inset 0 0 12px var(--color-amber-glow-wide)",
          backgroundColor: "rgba(10,10,15,0.85)",
        }}
      >
        {/* MOCK HEDGE badge — amber, top-right */}
        <div
          className="absolute -top-3 -right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: "rgba(255,184,0,0.15)",
            border: "1px solid var(--color-amber)",
            color: "var(--color-amber)",
            boxShadow: "0 0 8px var(--color-amber-glow)",
          }}
        >
          MOCK HEDGE
        </div>

        {state === "alert" && (
          <div className="px-6 py-6 text-center">
            <div
              className="text-3xl font-bold mb-2 text-halo"
              style={{ color: "var(--color-magenta)" }}
            >
              ⚠ RED CARD
            </div>
            <p className="text-sm text-ink-body mb-1 text-halo">
              Risk detected at minute 67.
            </p>
            <p className="text-xs text-ink-muted mb-6 text-halo">
              Your position is at risk. Hedge now to limit exposure.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-semibold rounded-lg border"
                style={{
                  borderColor: "var(--color-chrome-border-strong)",
                  color: "var(--color-ink-muted)",
                  minHeight: "44px",
                }}
              >
                Dismiss
              </button>
              <button
                onClick={handleHedge}
                className="btn-neon btn-neon-amber"
                style={{ minHeight: "44px" }}
              >
                Hedge Now
              </button>
            </div>
          </div>
        )}

        {state === "loading" && (
          <div className="px-6 py-8 text-center">
            <div
              className="font-mono text-sm mb-4 text-halo"
              style={{ color: "var(--color-amber)" }}
            >
              Executing hedge…
            </div>
            <div
              className="inline-block w-6 h-6 border-2 rounded-full animate-spin"
              style={{
                borderColor: "var(--color-amber)",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-xs text-ink-faint mt-4 text-halo">
              (Simulated — no real transaction)
            </p>
          </div>
        )}

        {state === "confirmed" && (
          <div className="px-6 py-6 text-center">
            <div
              className="text-3xl font-bold mb-2 text-halo"
              style={{ color: "var(--color-acid)" }}
            >
              ✓ Hedged
            </div>
            <p className="text-sm text-ink-body mb-1 text-halo">
              Position hedged successfully.
            </p>
            <p className="text-xs text-ink-faint mb-6 text-halo">
              (Mock — no real on-chain transaction)
            </p>
            <button
              onClick={handleDismiss}
              className="btn-neon"
              style={{
                borderColor: "var(--color-acid)",
                color: "var(--color-acid)",
                boxShadow: "0 0 8px, 0 0 20px var(--color-acid-glow)",
                minHeight: "44px",
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
