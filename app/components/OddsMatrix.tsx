"use client";

import { useTxLine } from "@/lib/txline/TxLineProvider";

interface OddsMatrixProps {
  onSelectBet: (bet: string) => void;
  activeBet: string | null;
}

export function OddsMatrix({ onSelectBet, activeBet }: OddsMatrixProps) {
  const packet = useTxLine();

  const odds = packet?.oddsSnapshot;
  const home = odds?.home.toFixed(2) ?? "1.50";
  const draw = odds?.draw.toFixed(2) ?? "2.80";
  const away = odds?.away.toFixed(2) ?? "1.50";

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Odds
      </div>
      <div className="grid grid-cols-3 gap-2 w-full">
        {[
          { label: "1", value: home },
          { label: "X", value: draw },
          { label: "2", value: away },
        ].map((item) => {
          const isActive = activeBet === item.label;
          return (
            <button
              key={item.label}
              onClick={() => onSelectBet(item.label)}
              className={
                "rounded-xl px-3 py-3 text-center transition-all duration-200 cursor-pointer " +
                (isActive
                  ? "bg-cyan-500/20 border border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  : "bg-white/5 hover:bg-white/10 border border-transparent")
              }
            >
              <div className="text-xs font-mono text-slate-500 mb-1">{item.label}</div>
              <div className="font-mono text-sm font-semibold text-slate-200">{item.value}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
