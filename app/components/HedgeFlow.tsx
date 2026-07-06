"use client";

import { useState } from "react";
import { useRisk } from "@/lib/risk/RiskEngineProvider";
import { RiskAlertSheet } from "./RiskAlertSheet";
import { BlinkHedgeCard } from "./BlinkHedgeCard";

export function HedgeFlow() {
  const { activeRisk, dismiss } = useRisk();
  const [showBlinkCard, setShowBlinkCard] = useState(false);

  if (!activeRisk && !showBlinkCard) return null;

  const handleHedge = () => {
    setShowBlinkCard(true);
  };

  const handleClose = () => {
    setShowBlinkCard(false);
    dismiss();
  };

  const marketId = "wc-2026-final";

  return (
    <>
      {activeRisk && !showBlinkCard && <RiskAlertSheet onHedge={handleHedge} />}
      {showBlinkCard && (
        <BlinkHedgeCard marketId={marketId} onClose={handleClose} />
      )}
    </>
  );
}