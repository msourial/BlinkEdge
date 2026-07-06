"use client";

import { useRisk } from "@/lib/risk/RiskEngineProvider";
import { severityColor } from "@/lib/risk/riskEngine";

export function RiskAlertSheet({ onHedge }: { onHedge: () => void }) {
  const { activeRisk, dismiss } = useRisk();

  if (!activeRisk) return null;

  const color = severityColor(activeRisk.severity);
  const borderColor =
    color === "magenta" ? "var(--color-magenta)" : "var(--color-amber)";
  const textColor =
    color === "magenta" ? "var(--color-magenta)" : "var(--color-amber)";
  const glowWide =
    color === "magenta"
      ? "var(--color-magenta-glow-wide)"
      : "var(--color-amber-glow-wide)";

  return (
    <div
      className="hud-card safe-bottom absolute bottom-0 inset-x-0 mx-auto max-w-md"
      style={{
        zIndex: 30,
        borderColor,
        boxShadow: `0 0 8px, 0 0 20px, 0 0 40px, inset 0 0 12px ${glowWide}`,
        backgroundColor: "rgba(10,10,15,0.85)",
        animation: "slideUp 300ms ease-out",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hud-card[style*="slideUp"] { animation: none !important; }
        }
      `}</style>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between mb-3">
          <div
            className="text-xs font-bold uppercase tracking-wider text-halo"
            style={{ color: textColor }}
          >
            {activeRisk.severity} Risk
          </div>
          <button
            onClick={dismiss}
            className="text-ink-faint text-sm hover:text-ink-muted transition-colors"
            style={{ minHeight: "auto", minWidth: "24px", padding: "2px 6px" }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-ink-body mb-4 text-halo leading-relaxed">
          {activeRisk.rationale}
        </p>
        <button
          onClick={onHedge}
          className="btn-neon w-full"
          style={{
            borderColor: textColor,
            color: textColor,
            boxShadow: `0 0 8px, 0 0 20px ${glowWide}`,
            minHeight: "44px",
          }}
        >
          Hedge Now
        </button>
      </div>
    </div>
  );
}