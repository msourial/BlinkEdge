"use client";

import type { NormalizedMatch } from "@/lib/matches/types";
import { CountryFlag } from "./CountryFlag";

export function MatchCard({
  match,
  onSelect,
}: {
  match: NormalizedMatch;
  onSelect: () => void;
}) {
  const kickoffDate = new Date(match.kickoff);
  const formattedTime = match.status === "live"
    ? match.score?.minute ? `${match.score.minute}'` : "LIVE"
    : kickoffDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      timeZoneName: "short",
      });
  const formattedDate = kickoffDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={onSelect}
      className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 overflow-hidden font-sans text-left text-sm font-semibold text-slate-200">
          <CountryFlag code={match.homeCountryCode} country={match.homeTeam} />
          <span className="truncate">{match.homeTeam}</span>
        </div>

        <div className="flex flex-col items-center shrink-0">
          <div className="font-mono text-2xl font-semibold text-slate-200">
            {match.score ? `${match.score.home} – ${match.score.away}` : "–  –"}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {formattedDate} · {formattedTime}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 overflow-hidden font-sans text-right text-sm font-semibold text-slate-200">
          <span className="truncate">{match.awayTeam}</span>
          <CountryFlag code={match.awayCountryCode} country={match.awayTeam} />
        </div>
      </div>

      <div className="text-[10px] text-slate-600 font-mono text-center mt-2">
        {match.status === "completed" ? (match.score ? "FINAL" : "FINAL SCORE PENDING") : match.status === "live" ? "LIVE DATA" : "UPCOMING"} · {match.stage ?? match.competition}
      </div>
    </button>
  );
}
