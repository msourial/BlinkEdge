export type RiskSeverity = "critical" | "high" | "medium";

export interface RiskAssessment {
  severity: RiskSeverity;
  ruleId: string;
  rationale: string;
  recommendedAction?: string;
  timestamp: number;
}

export type { TxLineEventPacket } from "@/lib/schema/txLineSchema";
