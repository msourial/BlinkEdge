"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Scoreboard } from "./Scoreboard";
import { ConsensusIndicator } from "./ConsensusIndicator";
import { OddsMatrix } from "./OddsMatrix";
import { ApiStatusIndicator } from "./ApiStatusIndicator";
import { MockHedgeModal } from "./MockHedgeModal";

interface ArHudProps {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  isLive: boolean;
  activeBet: string | null;
  onCameraReady: () => void;
  onSelectBet: (bet: string | null) => void;
  onBack: () => void;
  onHome: () => void;
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
  onHome,
}: ArHudProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readyCalled = useRef(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        if (
          typeof window !== "undefined" &&
          window.location.protocol !== "https:" &&
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1"
        ) {
          setCameraUnavailable(true);
          onCameraReady();
          return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraUnavailable(true);
          onCameraReady();
          return;
        }
        const stream = await Promise.race<MediaStream>([
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          }),
          new Promise<MediaStream>((_, reject) => {
            window.setTimeout(() => reject(new Error("Camera permission timed out")), 4_000);
          }),
        ]);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        // A camera is helpful but not required: keep the live data HUD usable on desktop.
        setCameraUnavailable(true);
        onCameraReady();
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
  }, [fixtureId, onCameraReady]);

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

      {cameraUnavailable && (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,240,255,0.12),transparent_35%),linear-gradient(135deg,#080811,#101021)]">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(0,240,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.14)_1px,transparent_1px)] [background-size:32px_32px]" />
          <p className="absolute inset-x-0 top-[42%] text-center font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/70">Camera unavailable · HUD mode</p>
        </div>
      )}

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
          <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-md border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-300/60 hover:text-cyan-200"
            >
              &larr; Matches
            </button>
            <button
              onClick={onHome}
              className="rounded-md border border-white/15 bg-black/30 px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition-colors hover:border-cyan-300/60 hover:text-cyan-200"
            >
              Home
            </button>
          </div>

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

          {activeBet && (
            <MockHedgeModal
              onClose={() => onSelectBet(null)}
              betSelection={activeBet}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          )}
        </>
      )}
    </>
  );
}
