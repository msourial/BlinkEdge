"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";
import { useTxLine } from "@/lib/txline/TxLineProvider";
import { evaluate } from "@/lib/risk/riskEngine";
import type { RiskAssessment } from "@/lib/risk/types";

interface RiskContextValue {
  activeRisk: RiskAssessment | null;
  dismiss: () => void;
}

const RiskContext = createContext<RiskContextValue>({ activeRisk: null, dismiss: () => {} });

export function RiskEngineProvider({ children }: { children: ReactNode }) {
  const packet = useTxLine();
  const [prevPacket, setPrevPacket] = useState<TxLineEventPacket | null>(null);
  const [activeRisk, setActiveRisk] = useState<RiskAssessment | null>(null);

  useEffect(() => {
    if (!packet) return;
    if (prevPacket) {
      const assessments = evaluate(prevPacket, packet);
      if (assessments.length > 0) {
        // Only set if no active risk (don't override until dismissed)
        setActiveRisk((prev) => prev ?? assessments[0]);
      }
    }
    setPrevPacket(packet);
  }, [packet, prevPacket]);

  const dismiss = () => setActiveRisk(null);

  return (
    <RiskContext.Provider value={{ activeRisk, dismiss }}>
      {children}
    </RiskContext.Provider>
  );
}

export function useRisk() {
  return useContext(RiskContext);
}