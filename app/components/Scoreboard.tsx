"use client";

import { useTxLine } from "@/lib/txline/TxLineProvider";

export function Scoreboard({ homeTeam, awayTeam }: { homeTeam: string; awayTeam: string }) {
  const packet = useTxLine();

  const homeScore = packet?.score.home ?? 0;
  const awayScore = packet?.score.away ?? 0;
  const minute = packet?.minute ?? 0;

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl w-full">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-center flex-1 min-w-0">
          <div className="font-mono text-2xl font-bold text-slate-200">
            {homeScore}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
            {homeTeam}
          </div>
        </div>

        <div className="text-center shrink-0 mx-3">
          <div className="text-sm font-bold font-mono text-slate-400">
            {minute}&apos;
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-wider">
            LIVE
          </div>
        </div>

        <div className="text-center flex-1 min-w-0">
          <div className="font-mono text-2xl font-bold text-slate-200">
            {awayScore}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
            {awayTeam}
          </div>
        </div>
      </div>
    </div>
  );
}
