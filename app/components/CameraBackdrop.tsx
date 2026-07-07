"use client";

import { useState, useRef, useEffect } from "react";

type CameraState = "idle" | "requesting" | "granted" | "denied" | "error" | "skipped" | "reconnecting" | "unsupported";

export function CameraBackdrop() {
  const [state, setState] = useState<CameraState>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      setState("unsupported");
    }
  }, []);

  const startCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
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

  const skipCamera = () => setState("skipped");

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

  // Gradient backdrop — ALWAYS rendered (z-0) so HUD widgets on top always have context
  const gradientBackdrop = (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 0,
        background:
          "radial-gradient(ellipse at 50% 40%, rgba(0,240,255,0.18) 0%, rgba(10,10,15,0.6) 60%, var(--color-canvas) 100%)",
      }}
    />
  );

  // Granted — video feed replaces gradient as the backdrop
  if (state === "granted") {
    return (
      <>
        {gradientBackdrop}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ zIndex: 1 }}
        />
      </>
    );
  }

  if (state === "reconnecting") {
    return (
      <>
        {gradientBackdrop}
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 5 }}>
          <p className="font-mono text-halo animate-pulse" style={{ color: "var(--color-amber)" }}>
            Camera re-connecting…
          </p>
        </div>
      </>
    );
  }

  // idle / requesting / denied / error / skipped / unsupported
  // Gate is now a SMALL CARD centered on screen — NOT full-screen, so HUD widgets stay visible + interactive
  const showGate = state !== "skipped";

  return (
    <>
      {gradientBackdrop}

      {showGate && (
        <div
          className="hud-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-xs w-[90%] sm:w-80 px-6 py-6"
          style={{
            zIndex: 15,
            borderColor: state === "denied" || state === "error" ? "var(--color-amber)" : "var(--color-primary)",
            boxShadow:
              state === "denied" || state === "error"
                ? "0 0 8px, 0 0 24px var(--color-amber-glow-wide), inset 0 0 12px var(--color-amber-glow-wide)"
                : "0 0 8px, 0 0 24px var(--color-primary-glow-wide), inset 0 0 12px var(--color-primary-glow-wide)",
            backgroundColor: "rgba(10,10,15,0.88)",
          }}
        >
          {state === "idle" && (
            <div className="text-center">
              <h2
                className="text-lg font-bold mb-2 text-halo"
                style={{ color: "var(--color-primary)" }}
              >
                Enable Camera
              </h2>
              <p className="text-ink-muted mb-4 text-xs text-halo leading-relaxed">
                Point your phone at the TV to see live match data floating over the broadcast.
              </p>
              <button
                onClick={startCamera}
                className="btn-neon w-full"
                style={{ minHeight: "44px" }}
              >
                Enable Camera
              </button>
              <button
                onClick={skipCamera}
                className="text-[11px] underline mt-3"
                style={{ color: "var(--color-ink-muted)", minHeight: "auto", padding: "2px 6px" }}
              >
                Skip — use gradient backdrop
              </button>
            </div>
          )}

          {state === "requesting" && (
            <div className="text-center">
              <div
                className="inline-block w-5 h-5 border-2 rounded-full animate-spin mx-auto mb-3"
                style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
              />
              <p className="text-sm font-mono text-halo" style={{ color: "var(--color-primary)" }}>
                Waiting for permission…
              </p>
              <p className="text-[11px] text-ink-faint mt-2 text-halo">
                Check your browser for the prompt.
              </p>
            </div>
          )}

          {state === "denied" && (
            <div className="text-center">
              <h2 className="text-lg font-bold mb-2 text-halo" style={{ color: "var(--color-amber)" }}>
                Camera Unavailable
              </h2>
              <p className="text-ink-muted mb-4 text-xs text-halo leading-relaxed">
                Camera denied or no webcam. The HUD still works — explore with the gradient backdrop.
              </p>
              <button
                onClick={skipCamera}
                className="btn-neon w-full"
                style={{
                  minHeight: "44px",
                  borderColor: "var(--color-amber)",
                  color: "var(--color-amber)",
                }}
              >
                Continue with Gradient
              </button>
              <button
                onClick={startCamera}
                className="text-[11px] underline mt-3"
                style={{ color: "var(--color-ink-muted)", minHeight: "auto", padding: "2px 6px" }}
              >
                Try camera again
              </button>
            </div>
          )}

          {state === "error" && (
            <div className="text-center">
              <h2 className="text-lg font-bold mb-2 text-halo" style={{ color: "var(--color-magenta)" }}>
                Camera Error
              </h2>
              <p className="text-ink-muted mb-4 text-xs text-halo">
                An unexpected error occurred. The HUD still works without camera.
              </p>
              <button
                onClick={skipCamera}
                className="btn-neon w-full"
                style={{ minHeight: "44px", borderColor: "var(--color-magenta)", color: "var(--color-magenta)" }}
              >
                Continue with Gradient
              </button>
            </div>
          )}

          {state === "unsupported" && (
            <div className="text-center">
              <h2 className="text-lg font-bold mb-2 text-halo" style={{ color: "var(--color-amber)" }}>
                Camera Not Supported
              </h2>
              <p className="text-ink-muted mb-4 text-xs text-halo leading-relaxed">
                Browser doesn&apos;t support camera API (HTTP or older browser). HUD works with gradient.
              </p>
              <button
                onClick={skipCamera}
                className="btn-neon w-full"
                style={{ minHeight: "44px", borderColor: "var(--color-amber)", color: "var(--color-amber)" }}
              >
                Continue with Gradient
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}