"use client";

import { useTxLine } from "@/lib/txline/TxLineProvider";

export function Scoreboard() {
  const packet = useTxLine();

  const homeScore = packet?.score.home ?? 0;
  const awayScore = packet?.score.away ?? 0;
  const minute = packet?.minute ?? 0;

  return (
    <div
      className="hud-card safe-top absolute top-0 inset-x-0 mx-auto max-w-md"
      style={{
        zIndex: 20,
        borderColor: "var(--color-primary)",
        boxShadow:
          "0 0 6px, 0 0 12px, inset 0 0 8px var(--color-primary-glow-wide)",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-center flex-1">
          <div
            className="font-mono text-2xl font-bold text-halo"
            style={{ color: "var(--color-primary)" }}
          >
            {homeScore}
          </div>
          <div className="text-xs text-ink-muted text-halo font-mono mt-1">
            BRA
          </div>
        </div>

        <div className="px-4">
          <div
            className="text-xs font-bold text-halo"
            style={{ color: "var(--color-ink-muted)" }}
          >
            {minute}&apos;
          </div>
          <div className="text-[10px] text-ink-faint text-halo font-mono mt-1">
            LIVE
          </div>
        </div>

        <div className="text-center flex-1">
          <div
            className="font-mono text-2xl font-bold text-halo"
            style={{ color: "var(--color-primary)" }}
          >
            {awayScore}
          </div>
          <div className="text-xs text-ink-muted text-halo font-mono mt-1">
            ARG
          </div>
        </div>
      </div>
    </div>
  );
}
