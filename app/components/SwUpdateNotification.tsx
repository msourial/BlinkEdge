"use client";

import { useState, useEffect } from "react";
import { useSerwist } from "@serwist/turbopack/react";

export function SwUpdateNotification() {
  const { serwist } = useSerwist();
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!serwist) return;

    const onWaiting = () => setWaiting(true);
    serwist.addEventListener("waiting", onWaiting);
    return () => serwist.removeEventListener("waiting", onWaiting);
  }, [serwist]);

  if (!waiting) return null;

  const handleRefresh = () => {
    serwist?.messageSkipWaiting();
    window.location.reload();
  };

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 p-4 backdrop-blur-xl border-b border-cyan-400"
      style={{ backgroundColor: "rgba(0, 240, 255, 0.08)" }}
    >
      <div className="flex items-center justify-between max-w-screen-md mx-auto">
        <span className="text-sm font-semibold font-mono text-cyan-200">
          New Update Available
        </span>
        <button
          onClick={handleRefresh}
          className="text-xs uppercase tracking-wider px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-200 font-semibold transition-all duration-200"
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
}
