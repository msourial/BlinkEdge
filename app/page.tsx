"use client";

import { useState, useReducer, useEffect } from "react";
import { appStateReducer, INITIAL_APP_STATE } from "@/lib/txline/txLineAppMachine";
import { MatchSelector } from "./components/MatchSelector";
import { ArHud } from "./components/ArHud";
import { TxLineAuthScreen } from "./components/TxLineAuthScreen";
import { TxLineProvider } from "@/lib/txline/TxLineProvider";
import { WalletProvider } from "./components/WalletProvider";
import { RiskEngineProvider } from "@/lib/risk/RiskEngineProvider";
import { FIXTURE_IDS } from "@/lib/txline/txLineFixtureIds";

export default function Home() {
  const [appState, dispatch] = useReducer(appStateReducer, INITIAL_APP_STATE);
  const [authTokens, setAuthTokens] = useState<{ jwt: string; apiToken: string } | null>(null);
  const [activeBet, setActiveBet] = useState<string | null>(null);

  useEffect(() => {
    // Initial loading simulation
    const timer = setTimeout(() => {
      dispatch({ type: "LOADED" });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleAuthSuccess = (jwt: string, apiToken: string) => {
    setAuthTokens({ jwt, apiToken });
    dispatch({ type: "API_CONNECTED" });
  };

  const handleAuthError = (error: string) => {
    dispatch({ type: "API_ERROR", error });
  };

  return (
    <WalletProvider>
      <main className="w-screen min-h-screen bg-[#050508] flex justify-center items-center m-0 p-0 overflow-hidden font-sans text-white">
        <div className="w-full max-w-[412px] h-screen max-h-[892px] bg-[#0a0a14] relative flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.15)] border border-[#1c1c32] sm:rounded-[44px]">
          
          {appState.phase === "LOADING" && (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {appState.phase === "TXLINE_AUTH" && (
            <TxLineAuthScreen onSuccess={handleAuthSuccess} onError={handleAuthError} />
          )}

          {appState.phase === "MATCH_SELECT" && (
            <MatchSelector
              appState={appState}
              onSelectMatch={(matchId) => {
                const fixture = FIXTURE_IDS.find(f => f.fixtureId === matchId);
                dispatch({
                  type: "SELECT_MATCH",
                  match: { 
                    matchId, 
                    homeTeam: fixture?.homeTeam || "Home", 
                    awayTeam: fixture?.awayTeam || "Away" 
                  },
                });
              }}
              onRetry={() => dispatch({ type: "RETRY" })}
            />
          )}

          {appState.phase === "CAMERA_INIT" && (
            <div className="flex items-center justify-center h-full bg-black/60 backdrop-blur-md">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-sm text-cyan-300">Initializing Camera...</span>
              </div>
            </div>
          )}

          {authTokens && (appState.phase === "AR_HUD_LIVE" || appState.phase === "CAMERA_INIT") && (
            <RiskEngineProvider>
              <TxLineProvider
                fixtureId={appState.selectedMatch.matchId}
                jwt={authTokens.jwt}
                apiToken={authTokens.apiToken}
              >
                <ArHud
                  fixtureId={appState.selectedMatch.matchId}
                  homeTeam={appState.selectedMatch.homeTeam}
                  awayTeam={appState.selectedMatch.awayTeam}
                  isLive={appState.phase === "AR_HUD_LIVE"}
                  activeBet={activeBet}
                  onSelectBet={setActiveBet}
                  onCameraReady={() => dispatch({ type: "CAMERA_READY" })}
                  onBack={() => {
                    setActiveBet(null);
                    dispatch({ type: "GO_BACK" });
                  }}
                />
              </TxLineProvider>
            </RiskEngineProvider>
          )}

        </div>
      </main>
    </WalletProvider>
  );
}
