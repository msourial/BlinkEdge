"use client";

import type { FixtureEntry } from "@/lib/txline/txLineFixtureIds";

export function MatchCard({
  fixture,
  onSelect,
}: {
  fixture: FixtureEntry;
  onSelect: () => void;
}) {
  const kickoffDate = new Date(fixture.kickoff);
  const now = Date.now();
  const isLive = kickoffDate.getTime() <= now;

  const formattedTime = isLive
    ? "LIVE"
    : kickoffDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });

  return (
    <button
      onClick={onSelect}
      className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-sans text-sm font-semibold text-slate-200 text-left flex-1 truncate">
          {fixture.homeTeam}
        </div>

        <div className="flex flex-col items-center shrink-0">
          <div className="font-mono text-2xl font-semibold text-slate-200">
            0 - 0
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            {formattedTime}
          </div>
        </div>

        <div className="font-sans text-sm font-semibold text-slate-200 text-right flex-1 truncate">
          {fixture.awayTeam}
        </div>
      </div>

      <div className="text-[10px] text-slate-600 font-mono text-center mt-2">
        {fixture.competition}
      </div>
    </button>
  );
}
