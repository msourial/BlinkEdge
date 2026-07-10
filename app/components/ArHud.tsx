"use client";

import { useRef, useEffect, useCallback } from "react";
import { Scoreboard } from "./Scoreboard";
import { ConsensusIndicator } from "./ConsensusIndicator";
import { OddsMatrix } from "./OddsMatrix";
import { ApiStatusIndicator } from "./ApiStatusIndicator";

interface ArHudProps {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  isLive: boolean;
  activeBet: string | null;
  onCameraReady: () => void;
  onSelectBet: (bet: string | null) => void;
  onBack: () => void;
}

export function ArHud({
  fixtureId,
  homeTeam,
  awayTeam,
  isLive,
  activeBet,
  onCameraReady,
  onSelectBet,
  onBack,
}: ArHudProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readyCalled = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.location.protocol !== "https:" &&
          window.location.hostname !== "localhost"
        ) {
          return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        /* parent handles errors via API_ERROR transition */
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [fixtureId]);

  const handlePlay = useCallback(() => {
    if (readyCalled.current) return;
    readyCalled.current = true;
    onCameraReady();
  }, [onCameraReady]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onPlay={handlePlay}
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {!isLive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-sm text-cyan-300">
              Starting Camera&hellip;
            </span>
          </div>
        </div>
      )}

      {isLive && (
        <>
          <button
            onClick={onBack}
            className="absolute top-4 left-4 z-30 text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200"
          >
            &larr; Back
          </button>

          <div className="absolute top-6 inset-x-0 flex flex-col items-center z-20 pointer-events-none">
            <Scoreboard homeTeam={homeTeam} awayTeam={awayTeam} />
          </div>

          <div className="absolute top-2 right-2 z-30">
            <ApiStatusIndicator />
          </div>

          <div className="absolute bottom-0 inset-x-0 bg-black/40 backdrop-blur-2xl border-t border-white/10 p-6 rounded-t-[2.5rem] z-20 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <ConsensusIndicator homeTeam={homeTeam} awayTeam={awayTeam} />
            <OddsMatrix onSelectBet={onSelectBet} activeBet={activeBet} />
          </div>
        </>
      )}
    </>
  );
}
