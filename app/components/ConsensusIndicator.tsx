"use client";

import { useTxLine } from "@/lib/txline/TxLineProvider";

export function ConsensusIndicator() {
  const packet = useTxLine();

  const consensus = packet?.consensus;
  const direction = consensus?.direction ?? "draw";
  const confidence = consensus?.confidence ?? 0.5;
  const possession = packet?.possession;
  const homePossession = possession?.home ?? 50;

  const directionLabel =
    direction === "home" ? "BRA" : direction === "away" ? "ARG" : "DRAW";
  const directionColor =
    direction === "home"
      ? "var(--color-acid)"
      : direction === "away"
        ? "var(--color-magenta)"
        : "var(--color-amber)";

  return (
    <div
      className="hud-card hud-card-acid safe-bottom absolute bottom-0 inset-x-0 mx-auto max-w-md"
      style={{
        zIndex: 20,
        borderColor: "var(--color-acid)",
        boxShadow:
          "0 0 6px, 0 0 12px, inset 0 0 8px var(--color-acid-glow-wide)",
      }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div
            className="text-[10px] font-bold uppercase tracking-wider text-halo"
            style={{ color: "var(--color-acid)" }}
          >
            CONSENSUS
          </div>
          <div
            className="font-mono text-xs font-semibold text-halo"
            style={{ color: directionColor }}
          >
            {directionLabel} {(confidence * 100).toFixed(0)}%
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono text-halo"
            style={{ color: "var(--color-ink-muted)" }}
          >
            POS
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-surface-deep overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${homePossession}%`,
                background: `linear-gradient(90deg, var(--color-acid), var(--color-acid-glow))`,
              }}
            />
          </div>
          <span
            className="text-[10px] font-mono text-halo"
            style={{ color: "var(--color-ink-muted)" }}
          >
            {homePossession.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
