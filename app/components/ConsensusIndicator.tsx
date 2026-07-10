"use client";

import { useTxLine } from "@/lib/txline/TxLineProvider";

export function ConsensusIndicator({ homeTeam, awayTeam }: { homeTeam: string; awayTeam: string }) {
  const packet = useTxLine();

  const consensus = packet?.consensus;
  const direction = consensus?.direction ?? "draw";
  const confidence = consensus?.confidence ?? 0.5;
  const possession = packet?.possession;
  const homePossession = possession?.home ?? 50;

  const directionLabel =
    direction === "home" ? homeTeam : direction === "away" ? awayTeam : "DRAW";

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Consensus
        </span>
        <span className="font-mono text-xs font-semibold text-slate-200">
          {directionLabel} {(confidence * 100).toFixed(0)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">
          POS
        </span>
        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-400 to-blue-600"
            style={{
              width: `${homePossession}%`,
            }}
          />
        </div>
        <span className="text-xs font-mono text-slate-500">
          {homePossession.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
