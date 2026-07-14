"use client";

import { useMemo, useState } from "react";
import { useMatchTimeline } from "@/lib/matches/useMatchTimeline";
import type { NormalizedMatch } from "@/lib/matches/types";
import type { AppState } from "@/lib/txline/txLineAppMachine";
import { MatchCard } from "./MatchCard";

export function MatchSelector({
  appState,
  onSelectMatch,
  onRetry,
  onHome,
  jwt,
  apiToken,
}: {
  appState: AppState;
  onSelectMatch: (match: NormalizedMatch) => void;
  onRetry: () => void;
  onHome: () => void;
  jwt?: string;
  apiToken?: string;
}) {
  const [filter, setFilter] = useState<"completed" | "live" | "upcoming">("completed");
  const { timeline, isLoading, refresh } = useMatchTimeline(jwt, apiToken);
  const matches = useMemo(() => timeline.matches.filter((match) => match.status === filter), [filter, timeline.matches]);
  const counts = useMemo(() => ({
    completed: timeline.matches.filter((match) => match.status === "completed").length,
    live: timeline.matches.filter((match) => match.status === "live").length,
    upcoming: timeline.matches.filter((match) => match.status === "upcoming").length,
  }), [timeline.matches]);
  return (
    <div
      className="h-full w-full overflow-y-auto p-4"
      style={{
        contain: "layout paint",
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(10,10,15,0.8) 0%, #0a0a0f 100%)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">TxLINE feed</p>
          <h1 className="mt-1 text-xl font-bold font-mono uppercase tracking-wider text-cyan-400">Matches</h1>
        </div>
        <button
          type="button"
          onClick={onHome}
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-slate-300 transition hover:border-cyan-300/60 hover:text-cyan-200"
        >
          Home
        </button>
      </header>

      {/* Loading State */}
      {(appState.phase === "LOADING" || (isLoading && timeline.matches.length === 0)) && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/5 rounded-2xl p-4 h-24 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Loaded State */}
      {appState.phase === "MATCH_SELECT" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Match status filters">
            {(["completed", "live", "upcoming"] as const).map((status) => (
              <button key={status} type="button" onClick={() => setFilter(status)} className={`shrink-0 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider ${filter === status ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-white/10 text-slate-400"}`}>
                {status} {counts[status]}
              </button>
            ))}
            <button type="button" onClick={() => void refresh()} className="ml-auto shrink-0 rounded-full border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400" aria-label="Refresh matches">Refresh</button>
          </div>
          <p className={`font-mono text-[10px] ${timeline.stale ? "text-amber-300" : "text-slate-500"}`}>
            {timeline.source === "txline" ? "TXLINE LIVE SNAPSHOT" : timeline.source === "cache" ? "SAVED SNAPSHOT" : timeline.source === "schedule" ? "CONFIRMED SCHEDULE" : "TXODDS ARCHIVE"} · {timeline.stale ? "STALE — " : ""}{new Date(timeline.fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          {timeline.error && <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">{timeline.error}</p>}
          {matches.length === 0 ? (
            <div className="flex flex-col items-center text-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="font-mono text-xl font-semibold text-slate-200">
                No {filter} matches
              </h2>
              <p className="font-sans text-sm text-slate-400 mt-2">
                Check back when World Cup fixtures are live, or pull to refresh.
              </p>
            </div>
          ) : (
            matches.map((match) => (
              <MatchCard
                key={match.fixtureId}
                match={match}
                onSelect={() => onSelectMatch(match)}
              />
            ))
          )}
        </div>
      )}

      {/* Error State */}
      {appState.phase === "API_ERROR" && (
        <div className="flex flex-col items-center text-center bg-black/40 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6">
          <h2 className="font-mono text-xl font-semibold text-slate-200">
            Connection Lost
          </h2>
          <p className="font-sans text-sm text-slate-400 mt-2 mb-4">
            Can&apos;t reach TxODDS data. Check your connection and try again.
          </p>
          <button
            onClick={onRetry}
            className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-400/50 text-amber-200 font-bold tracking-widest uppercase rounded-xl transition-all duration-200 active:scale-[0.98]"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
