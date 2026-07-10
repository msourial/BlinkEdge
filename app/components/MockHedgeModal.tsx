"use client";

import { useState, useEffect } from "react";
import { useTxLine } from "@/lib/txline/TxLineProvider";

type HedgeState = "idle" | "alert" | "loading" | "confirmed";

interface MockHedgeModalProps {
  onClose: () => void;
  betSelection?: string | null;
  homeTeam?: string;
  awayTeam?: string;
}

export function MockHedgeModal({ onClose, betSelection, homeTeam = "Home", awayTeam = "Away" }: MockHedgeModalProps) {
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
    onClose();
  };

  const odds = packet?.oddsSnapshot;
  const betOdds =
    betSelection === "1"
      ? odds?.home.toFixed(2)
      : betSelection === "2"
        ? odds?.away.toFixed(2)
        : odds?.draw.toFixed(2);

  const betTeam =
    betSelection === "1" ? homeTeam : betSelection === "2" ? awayTeam : "DRAW";

  // Bet confirmation flow
  if (betSelection) {
    return (
      <div className="absolute inset-0 z-[9999] flex items-end justify-center">
        <div
          className="absolute inset-0 bg-black/60"
          onClick={onClose}
        />
        <div className="relative w-full bg-black/60 backdrop-blur-2xl border-t border-white/10 rounded-t-[2.5rem] p-6 animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Confirm Bet
            </span>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-mono mb-1">
                {betSelection === "1" ? "HOME" : betSelection === "2" ? "AWAY" : "DRAW"}
              </div>
              <div className="font-mono text-xl font-bold text-slate-200">
                {betTeam}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-mono mb-1">ODDS</div>
              <div className="font-mono text-xl font-bold text-cyan-400">
                {betOdds}x
              </div>
            </div>
          </div>

          <button
            onClick={handleHedge}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            Place Bet
          </button>
        </div>
      </div>
    );
  }

  // Hedge alert flow (existing)
  if (state === "idle") return null;

  return (
    <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-sm w-full mx-4 relative overflow-hidden">
        <div
          className="absolute -top-3 -right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_8px_rgba(255,184,0,0.3)]"
        >
          MOCK HEDGE
        </div>

        {state === "alert" && (
          <div className="px-6 py-6 text-center">
            <div className="text-3xl font-bold mb-2 text-pink-400">
              ⚠ RED CARD
            </div>
            <p className="text-sm text-slate-300 mb-1">
              Risk detected at minute 67.
            </p>
            <p className="text-xs text-slate-500 mb-6">
              Your position is at risk. Hedge now to limit exposure.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleHedge}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-[0_0_20px_rgba(255,184,0,0.3)] transition-all"
              >
                Hedge Now
              </button>
            </div>
          </div>
        )}

        {state === "loading" && (
          <div className="px-6 py-8 text-center">
            <div className="font-mono text-sm mb-4 text-amber-400">
              Executing hedge…
            </div>
            <div className="inline-block w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 mt-4">
              (Simulated — no real transaction)
            </p>
          </div>
        )}

        {state === "confirmed" && (
          <div className="px-6 py-6 text-center">
            <div className="text-3xl font-bold mb-2 text-green-400">
              ✓ Hedged
            </div>
            <p className="text-sm text-slate-300 mb-1">
              Position hedged successfully.
            </p>
            <p className="text-xs text-slate-500 mb-6">
              (Mock — no real on-chain transaction)
            </p>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
