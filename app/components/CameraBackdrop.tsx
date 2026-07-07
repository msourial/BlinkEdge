"use client";

import { useState, useRef, useEffect } from "react";

type CameraState = "idle" | "requesting" | "granted" | "denied" | "error" | "skipped" | "reconnecting" | "unsupported";

export function CameraBackdrop() {
  const [state, setState] = useState<CameraState>("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Detect non-secure context (HTTP) or missing mediaDevices API on mount
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      const isSecure = window.isSecureContext;
      setState(isSecure ? "unsupported" : "unsupported");
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

  // Gradient backdrop — always rendered behind the gate UI so HUD widgets stay visible
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

  // Granted — render the video feed (no gate UI on top)
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
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 5 }}
        >
          <div className="text-center">
            <p
              className="text-lg font-mono text-halo animate-pulse"
              style={{ color: "var(--color-amber)" }}
            >
              Camera re-connecting…
            </p>
          </div>
        </div>
      </>
    );
  }

  // idle / requesting / denied / error / skipped / unsupported — show gate UI over gradient
  const isCameraGateVisible =
    state === "idle" || state === "requesting" || state === "denied" || state === "error" || state === "unsupported";

  return (
    <>
      {gradientBackdrop}

      {/* Camera gate UI — centered, HUD widgets (z-20) render on top */}
      {isCameraGateVisible && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 10 }}
        >
          <div className="text-center px-8 max-w-sm">
            {state === "idle" && (
              <>
                <h2
                  className="text-2xl font-bold mb-3 text-halo"
                  style={{ color: "var(--color-primary)" }}
                >
                  Enable Camera
                </h2>
                <p className="text-ink-muted mb-6 text-sm text-halo">
                  Point your phone at the TV to see live match data floating over the broadcast.
                </p>
                <div className="flex flex-col gap-3 items-center">
                  <button
                    onClick={startCamera}
                    className="btn-neon"
                    style={{ minHeight: "44px", width: "200px" }}
                  >
                    Enable Camera
                  </button>
                  <button
                    onClick={skipCamera}
                    className="text-xs underline"
                    style={{
                      color: "var(--color-ink-muted)",
                      minHeight: "auto",
                      padding: "4px 8px",
                    }}
                  >
                    Skip — use gradient backdrop
                  </button>
                </div>
              </>
            )}

            {state === "requesting" && (
              <>
                <div
                  className="inline-block w-6 h-6 border-2 rounded-full animate-spin mx-auto mb-4"
                  style={{
                    borderColor: "var(--color-primary)",
                    borderTopColor: "transparent",
                  }}
                />
                <p
                  className="text-sm font-mono text-halo"
                  style={{ color: "var(--color-primary)" }}
                >
                  Waiting for camera permission…
                </p>
                <p className="text-xs text-ink-faint mt-2 text-halo">
                  Check your browser for the permission prompt.
                </p>
              </>
            )}

            {state === "denied" && (
              <>
                <h2
                  className="text-xl font-bold mb-3 text-halo"
                  style={{ color: "var(--color-amber)" }}
                >
                  Camera Unavailable
                </h2>
                <p className="text-ink-muted mb-6 text-sm text-halo">
                  Camera permission was denied or no webcam detected. The HUD
                  still works — explore with the gradient backdrop.
                </p>
                <div className="flex flex-col gap-3 items-center">
                  <button
                    onClick={skipCamera}
                    className="btn-neon"
                    style={{
                      minHeight: "44px",
                      width: "220px",
                      borderColor: "var(--color-amber)",
                      color: "var(--color-amber)",
                    }}
                  >
                    Continue with Gradient
                  </button>
                  <button
                    onClick={startCamera}
                    className="text-xs underline"
                    style={{
                      color: "var(--color-ink-muted)",
                      minHeight: "auto",
                      padding: "4px 8px",
                    }}
                  >
                    Try camera again
                  </button>
                </div>
              </>
            )}

            {state === "error" && (
              <>
                <h2
                  className="text-xl font-bold mb-3 text-halo"
                  style={{ color: "var(--color-magenta)" }}
                >
                  Camera Error
                </h2>
                <p className="text-ink-muted mb-6 text-sm text-halo">
                  An unexpected error occurred. The HUD still works without the camera.
                </p>
                <button
                  onClick={skipCamera}
                  className="btn-neon"
                  style={{
                    minHeight: "44px",
                    borderColor: "var(--color-magenta)",
                    color: "var(--color-magenta)",
                  }}
                >
                  Continue with Gradient
                </button>
              </>
            )}

            {state === "unsupported" && (
              <>
                <h2
                  className="text-xl font-bold mb-3 text-halo"
                  style={{ color: "var(--color-amber)" }}
                >
                  Camera Not Supported
                </h2>
                <p className="text-ink-muted mb-6 text-sm text-halo">
                  Your browser doesn&apos;t expose the camera API (maybe HTTP instead of HTTPS,
                  or an older browser). The HUD still works with the gradient backdrop.
                </p>
                <button
                  onClick={skipCamera}
                  className="btn-neon"
                  style={{
                    minHeight: "44px",
                    borderColor: "var(--color-amber)",
                    color: "var(--color-amber)",
                  }}
                >
                  Continue with Gradient
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Skipped state — just the gradient, no gate UI. */}
    </>
  );
}