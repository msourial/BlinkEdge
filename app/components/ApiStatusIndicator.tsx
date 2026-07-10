"use client";

import { useConnectionStatus } from "@/lib/txline/useConnectionStatus";

export function ApiStatusIndicator() {
  const status = useConnectionStatus();

  const config: Record<string, { dotClass: string; label: string; labelClass: string }> = {
    connecting: {
      dotClass: "bg-amber-400 animate-pulse",
      label: "Connecting…",
      labelClass: "text-amber-300",
    },
    connected: {
      dotClass: "bg-cyan-400",
      label: "Connected",
      labelClass: "text-cyan-300",
    },
    reconnecting: {
      dotClass: "bg-amber-400 animate-pulse",
      label: "Reconnecting…",
      labelClass: "text-amber-300",
    },
    disconnected: {
      dotClass: "",
      label: "Disconnected",
      labelClass: "",
    },
    stale: {
      dotClass: "bg-amber-400 animate-pulse",
      label: "Stale Data",
      labelClass: "text-amber-300",
    },
  };

  const c = config[status];

  const dotStyle =
    status === "connected"
      ? { boxShadow: "0 0 8px rgba(0,240,255,0.5)" }
      : status === "disconnected"
        ? { boxShadow: "0 0 8px rgba(255,0,229,0.5)" }
        : { boxShadow: "0 0 8px rgba(255,184,0,0.5)" };

  const labelColor =
    status === "disconnected" ? { color: "#ff00e5" } : undefined;

  return (
    <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-2 py-1 flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${c.dotClass}`}
        style={dotStyle}
      />
      <span
        className={`text-[10px] uppercase tracking-wider font-mono ${c.labelClass}`}
        style={labelColor}
      >
        {c.label}
      </span>
    </div>
  );
}
