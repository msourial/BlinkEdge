"use client";

import { FIXTURE_IDS } from "@/lib/txline/txLineFixtureIds";
import type { AppState } from "@/lib/txline/txLineAppMachine";
import { MatchCard } from "./MatchCard";

export function MatchSelector({
  appState,
  onSelectMatch,
  onRetry,
}: {
  appState: AppState;
  onSelectMatch: (matchId: number) => void;
  onRetry: () => void;
}) {
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
      <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-cyan-400 mb-4">
        Live Matches
      </h1>

      {/* Loading State */}
      {appState.phase === "LOADING" && (
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
          {FIXTURE_IDS.length === 0 ? (
            <div className="flex flex-col items-center text-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="font-mono text-xl font-semibold text-slate-200">
                No Live Matches
              </h2>
              <p className="font-sans text-sm text-slate-400 mt-2">
                Check back when World Cup fixtures are live, or pull to refresh.
              </p>
            </div>
          ) : (
            FIXTURE_IDS.map((fixture) => (
              <MatchCard
                key={fixture.fixtureId}
                fixture={fixture}
                onSelect={() => onSelectMatch(fixture.fixtureId)}
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
