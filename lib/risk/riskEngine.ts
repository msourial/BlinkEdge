import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";
import type { RiskAssessment, RiskSeverity } from "./types";

export interface RiskRule {
  id: string;
  evaluate(prev: TxLineEventPacket, cur: TxLineEventPacket, now: number): RiskAssessment | null;
}

const SEVERITY_COLOR: Record<RiskSeverity, string> = {
  critical: "magenta",
  high: "amber",
  medium: "amber",
};

export function severityColor(severity: RiskSeverity): string {
  return SEVERITY_COLOR[severity];
}

const HEDGE_ACTION_URL = (matchId: string) => `/api/actions/hedge/${matchId}`;

const rules: RiskRule[] = [
  {
    id: "red-card",
    evaluate: (prev, cur, now) => {
      const newRedCard = cur.events.find(
        (e) => e.type === "card" && e.cardType === "red" &&
          !prev.events.some((pe) => pe.type === "card" && pe.cardType === "red" && pe.minute === e.minute)
      );
      if (!newRedCard) return null;
      return {
        severity: "critical",
        ruleId: "red-card",
        rationale: `Red card at minute ${cur.minute} — ${newRedCard.team || "unknown team"} down to 10 men. Position at risk.`,
        recommendedAction: HEDGE_ACTION_URL(cur.matchId),
        timestamp: now,
      };
    },
  },
  {
    id: "injury",
    evaluate: (prev, cur, now) => {
      const newInjury = cur.events.find(
        (e) => e.type === "injury" &&
          !prev.events.some((pe) => pe.type === "injury" && pe.minute === e.minute)
      );
      if (!newInjury) return null;
      return {
        severity: "high",
        ruleId: "injury",
        rationale: `Injury at minute ${cur.minute} — key player impact likely. Consider hedging.`,
        recommendedAction: HEDGE_ACTION_URL(cur.matchId),
        timestamp: now,
      };
    },
  },
  {
    id: "odds-swing",
    evaluate: (prev, cur, now) => {
      const swingHome = Math.abs(cur.oddsSnapshot.home - prev.oddsSnapshot.home);
      const swingAway = Math.abs(cur.oddsSnapshot.away - prev.oddsSnapshot.away);
      const maxSwing = Math.max(swingHome, swingAway);
      const THRESHOLD = 0.18;
      if (maxSwing <= THRESHOLD) return null;
      const direction = swingHome > swingAway ? "home" : "away";
      return {
        severity: "high",
        ruleId: "odds-swing",
        rationale: `Odds swung ${(maxSwing * 100).toFixed(0)}% on ${direction} at minute ${cur.minute}. Market sentiment shift.`,
        recommendedAction: HEDGE_ACTION_URL(cur.matchId),
        timestamp: now,
      };
    },
  },
  {
    id: "lead-reversal",
    evaluate: (prev, cur, now) => {
      const prevLeader = prev.score.home > prev.score.away ? "home" : prev.score.away > prev.score.home ? "away" : null;
      const curLeader = cur.score.home > cur.score.away ? "home" : cur.score.away > cur.score.home ? "away" : null;
      if (!prevLeader || !curLeader) return null;
      if (prevLeader === curLeader) return null;
      return {
        severity: "critical",
        ruleId: "lead-reversal",
        rationale: `Lead reversed at minute ${cur.minute}. ${curLeader === "home" ? "BRA" : "ARG"} now ahead.`,
        recommendedAction: HEDGE_ACTION_URL(cur.matchId),
        timestamp: now,
      };
    },
  },
];

export function evaluate(
  prev: TxLineEventPacket | null,
  cur: TxLineEventPacket,
  now: number = Date.now()
): RiskAssessment[] {
  if (!prev) return [];
  return rules
    .map((rule) => rule.evaluate(prev, cur, now))
    .filter((a): a is RiskAssessment => a !== null);
}