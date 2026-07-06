"use client";

import { useState, useRef, useEffect } from "react";

type CameraState = "idle" | "requesting" | "granted" | "denied" | "error" | "reconnecting";

export function CameraBackdrop() {
  const [state, setState] = useState<CameraState>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setState("granted");
    } catch (err) {
      console.warn("Camera access denied or failed:", err);
      setState("denied");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (streamRef.current) {
          stopCamera();
          setState("reconnecting");
        }
      } else {
        if (state === "granted" || state === "reconnecting") {
          startCamera();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopCamera();
    };
  }, [state]);

  if (state === "idle" || state === "denied" || state === "error") {
    return (
      <div
        className="absolute inset-0 z-10 flex items-center justify-center"
        style={{
          background: `radial-gradient(ellipse at center, ${"rgba(0,240,255,0.15)"} 0%, var(--color-canvas) 70%)`,
        }}
      >
        <div className="text-center px-8">
          {state === "idle" && (
            <>
              <h2
                className="text-2xl font-bold mb-4 text-halo"
                style={{ color: "var(--color-primary)" }}
              >
                Enable Camera
              </h2>
              <p className="text-ink-muted mb-6 text-sm text-halo">
                Point your phone at the TV to see live match data floating over the broadcast.
              </p>
              <button
                onClick={startCamera}
                className="btn-neon"
                style={{ minHeight: "44px" }}
              >
                Enable Camera
              </button>
            </>
          )}
          {state === "denied" && (
            <>
              <h2
                className="text-2xl font-bold mb-4 text-halo"
                style={{ color: "var(--color-amber)" }}
              >
                Camera Unavailable
              </h2>
              <p className="text-ink-muted mb-6 text-sm text-halo">
                Using gradient fallback. Enable camera in browser settings to see the AR overlay.
              </p>
              <button
                onClick={startCamera}
                className="btn-neon"
                style={{ minHeight: "44px" }}
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (state === "reconnecting") {
    return (
      <div
        className="absolute inset-0 z-10 flex items-center justify-center"
        style={{ background: "rgba(10,10,15,0.8)" }}
      >
        <div className="text-center">
          <p
            className="text-lg font-mono text-halo"
            style={{ color: "var(--color-amber)" }}
          >
            Camera re-connecting…
          </p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover"
      style={{ zIndex: 0 }}
    />
  );
}
