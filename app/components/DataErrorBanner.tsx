"use client";

import { useConnectionStatus } from "@/lib/txline/useConnectionStatus";
import type { AppState } from "@/lib/txline/txLineAppMachine";

export function DataErrorBanner({
  appState,
  onRetry,
  onGoBack,
}: {
  appState: AppState;
  onRetry: () => void;
  onGoBack: () => void;
}) {
  const connectionStatus = useConnectionStatus();

  const isConnected = connectionStatus === "connected";

  if (appState.phase === "MATCH_SELECT" || appState.phase === "OFFLINE") return null;
  if (isConnected && appState.phase !== "API_ERROR") return null;

  const isError = appState.phase === "API_ERROR";
  const isStale = connectionStatus === "stale" && appState.phase === "AR_HUD_LIVE";

  return (
    <div
      className="absolute bottom-0 inset-x-0 z-40 p-4 backdrop-blur-xl border-t border-amber-500/20 transition-all duration-300"
      style={{
        backgroundColor: "rgba(255,184,0,0.05)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
      }}
    >
      {isError && (
        <div className="flex flex-col items-center text-center gap-2">
          <h2 className="font-mono text-xl font-semibold text-slate-200">
            Connection Lost
          </h2>
          <p className="font-sans text-sm text-slate-300">
            Can&apos;t reach TxODDS data. Check your connection and try again.
          </p>
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm uppercase tracking-wider rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/50 text-amber-200 font-semibold transition-all duration-200"
          >
            Retry
          </button>
        </div>
      )}

      {isStale && (
        <div className="flex flex-col items-center text-center gap-2">
          <h2 className="font-mono text-xl font-semibold text-slate-200">
            Stale Data
          </h2>
          <p className="font-sans text-sm text-slate-300">
            Last data received over 30s ago. Results may be outdated.
          </p>
          <button
            onClick={onGoBack}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
}
