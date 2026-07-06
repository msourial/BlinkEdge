"use client";

import { useTxLine } from "@/lib/txline/TxLineProvider";

export function OddsMatrix() {
  const packet = useTxLine();

  const odds = packet?.oddsSnapshot;
  const home = odds?.home.toFixed(2) ?? "1.50";
  const draw = odds?.draw.toFixed(2) ?? "2.80";
  const away = odds?.away.toFixed(2) ?? "1.50";

  return (
    <div
      className="hud-card hud-card-magenta safe-right absolute right-0 top-1/2 -translate-y-1/2 w-44"
      style={{
        zIndex: 20,
        borderColor: "var(--color-magenta)",
        boxShadow:
          "0 0 6px, 0 0 12px, inset 0 0 8px var(--color-magenta-glow-wide)",
      }}
    >
      <div className="px-3 py-3">
        <div
          className="text-[10px] font-bold uppercase tracking-wider mb-2 text-halo"
          style={{ color: "var(--color-magenta)" }}
        >
          ODDS
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-ink-muted text-halo font-mono">1</span>
            <span
              className="font-mono text-sm font-semibold text-halo"
              style={{ color: "var(--color-ink)" }}
            >
              {home}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-ink-muted text-halo font-mono">X</span>
            <span
              className="font-mono text-sm font-semibold text-halo"
              style={{ color: "var(--color-ink)" }}
            >
              {draw}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-ink-muted text-halo font-mono">2</span>
            <span
              className="font-mono text-sm font-semibold text-halo"
              style={{ color: "var(--color-ink)" }}
            >
              {away}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
