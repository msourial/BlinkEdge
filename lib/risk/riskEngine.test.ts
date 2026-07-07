import { describe, it, expect } from "vitest";
import { evaluate, severityColor } from "./riskEngine";
import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";

const basePacket = (overrides: Partial<TxLineEventPacket>): TxLineEventPacket => ({
  matchId: "wc-2026-final",
  timestamp: Date.parse("2026-07-19T15:00:00Z"),
  minute: 30,
  score: { home: 0, away: 0 },
  possession: { home: 50, away: 50 },
  events: [],
  oddsSnapshot: { home: 1.5, draw: 2.8, away: 1.5 },
  consensus: { direction: "draw", confidence: 0.5 },
  ...overrides,
});

describe("severityColor", () => {
  it("maps critical to magenta", () => {
    expect(severityColor("critical")).toBe("magenta");
  });
  it("maps high to amber", () => {
    expect(severityColor("high")).toBe("amber");
  });
  it("maps medium to amber", () => {
    expect(severityColor("medium")).toBe("amber");
  });
});

describe("evaluate", () => {
  it("returns empty array when prev is null", () => {
    const cur = basePacket({});
    const assessments = evaluate(null, cur);
    expect(assessments).toEqual([]);
  });

  it("returns empty array when nothing changed", () => {
    const packet = basePacket({});
    const assessments = evaluate(packet, packet);
    expect(assessments).toEqual([]);
  });

  describe("red-card rule", () => {
    it("detects new red card", () => {
      const prev = basePacket({ minute: 65, events: [] });
      const cur = basePacket({
        minute: 67,
        events: [
          { type: "card", minute: 67, team: "ARG", cardType: "red" },
        ],
      });
      const assessments = evaluate(prev, cur, 1000);

      expect(assessments).toHaveLength(1);
      expect(assessments[0].ruleId).toBe("red-card");
      expect(assessments[0].severity).toBe("critical");
      expect(assessments[0].rationale).toContain("minute 67");
      expect(assessments[0].rationale).toContain("ARG");
      expect(assessments[0].recommendedAction).toContain("/api/actions/hedge/");
    });

    it("ignores duplicate red card already in prev", () => {
      const redCard = { type: "card" as const, minute: 67, team: "ARG", cardType: "red" as const };
      const prev = basePacket({ minute: 67, events: [redCard] });
      const cur = basePacket({ minute: 68, events: [redCard] });
      const assessments = evaluate(prev, cur);

      expect(assessments.filter(a => a.ruleId === "red-card")).toHaveLength(0);
    });

    it("ignores yellow cards", () => {
      const prev = basePacket({ minute: 65, events: [] });
      const cur = basePacket({
        minute: 66,
        events: [{ type: "card", minute: 66, cardType: "yellow" }],
      });
      const assessments = evaluate(prev, cur);
      expect(assessments.filter(a => a.ruleId === "red-card")).toHaveLength(0);
    });

    it("triggers a new red card at a new minute even if a prior red card exists", () => {
      const prev = basePacket({
        minute: 70,
        events: [{ type: "card", minute: 67, team: "ARG", cardType: "red" }],
      });
      const cur = basePacket({
        minute: 75,
        events: [
          { type: "card", minute: 67, team: "ARG", cardType: "red" },
          { type: "card", minute: 75, team: "BRA", cardType: "red" },
        ],
      });
      const assessments = evaluate(prev, cur, 1000);
      expect(assessments.filter(a => a.ruleId === "red-card")).toHaveLength(1);
      expect(assessments[0].rationale).toContain("minute 75");
    });
  });

  describe("injury rule", () => {
    it("detects new injury", () => {
      const prev = basePacket({ minute: 40, events: [] });
      const cur = basePacket({
        minute: 42,
        events: [{ type: "injury", minute: 42, team: "BRA", player: "Neymar" }],
      });
      const assessments = evaluate(prev, cur, 5000);

      expect(assessments.filter(a => a.ruleId === "injury")).toHaveLength(1);
      expect(assessments[0].severity).toBe("high");
      expect(assessments[0].rationale).toContain("minute 42");
      expect(assessments[0].timestamp).toBe(5000);
    });

    it("does not duplicate existing injury", () => {
      const injury = { type: "injury" as const, minute: 42 };
      const prev = basePacket({ minute: 42, events: [injury] });
      const cur = basePacket({ minute: 43, events: [injury] });
      const assessments = evaluate(prev, cur);
      expect(assessments.filter(a => a.ruleId === "injury")).toHaveLength(0);
    });
  });

  describe("odds-swing rule", () => {
    it("detects large home odds swing above threshold", () => {
      const prev = basePacket({ minute: 50, oddsSnapshot: { home: 1.5, draw: 2.8, away: 1.5 } });
      const cur = basePacket({ minute: 52, oddsSnapshot: { home: 1.8, draw: 2.8, away: 1.4 } });
      // swingHome = 0.3 > 0.18 threshold
      const assessments = evaluate(prev, cur, 1000);

      expect(assessments.filter(a => a.ruleId === "odds-swing")).toHaveLength(1);
      expect(assessments[0].severity).toBe("high");
      expect(assessments[0].rationale).toContain("home");
    });

    it("detects away odds swing", () => {
      const prev = basePacket({ minute: 50, oddsSnapshot: { home: 1.5, draw: 2.8, away: 1.5 } });
      const cur = basePacket({ minute: 52, oddsSnapshot: { home: 1.4, draw: 2.8, away: 1.85 } });
      // swingAway = 0.35 > 0.18
      const assessments = evaluate(prev, cur);
      expect(assessments.filter(a => a.ruleId === "odds-swing")).toHaveLength(1);
      expect(assessments[0].rationale).toContain("away");
    });

    it("ignores small swing below threshold", () => {
      const prev = basePacket({ minute: 50, oddsSnapshot: { home: 1.5, draw: 2.8, away: 1.5 } });
      const cur = basePacket({ minute: 52, oddsSnapshot: { home: 1.65, draw: 2.8, away: 1.5 } });
      // swingHome = 0.15 < 0.18
      const assessments = evaluate(prev, cur);
      expect(assessments.filter(a => a.ruleId === "odds-swing")).toHaveLength(0);
    });

    it("boundary: exactly at threshold does not trigger (> strictly)", () => {
      const prev = basePacket({ minute: 50, oddsSnapshot: { home: 1.5, draw: 2.8, away: 1.5 } });
      const cur = basePacket({ minute: 52, oddsSnapshot: { home: 1.68, draw: 2.8, away: 1.5 } });
      // swingHome = 0.18, not > 0.18
      const assessments = evaluate(prev, cur);
      expect(assessments.filter(a => a.ruleId === "odds-swing")).toHaveLength(0);
    });
  });

  describe("lead-reversal rule", () => {
    it("detects lead flip home->away", () => {
      const prev = basePacket({ minute: 60, score: { home: 1, away: 0 } });
      const cur = basePacket({ minute: 62, score: { home: 1, away: 2 } });
      const assessments = evaluate(prev, cur, 9000);

      expect(assessments.filter(a => a.ruleId === "lead-reversal")).toHaveLength(1);
      expect(assessments[0].severity).toBe("critical");
      expect(assessments[0].rationale).toContain("ARG");
      expect(assessments[0].timestamp).toBe(9000);
    });

    it("detects lead flip away->home", () => {
      const prev = basePacket({ minute: 60, score: { home: 0, away: 1 } });
      const cur = basePacket({ minute: 62, score: { home: 2, away: 1 } });
      const assessments = evaluate(prev, cur);
      expect(assessments[0].ruleId).toBe("lead-reversal");
      expect(assessments[0].rationale).toContain("BRA");
    });

    it("does not trigger when scores stay tied", () => {
      const prev = basePacket({ minute: 60, score: { home: 1, away: 1 } });
      const cur = basePacket({ minute: 62, score: { home: 2, away: 2 } });
      const assessments = evaluate(prev, cur);
      expect(assessments.filter(a => a.ruleId === "lead-reversal")).toHaveLength(0);
    });

    it("does not trigger when leader strengthens", () => {
      const prev = basePacket({ minute: 60, score: { home: 1, away: 0 } });
      const cur = basePacket({ minute: 62, score: { home: 3, away: 0 } });
      const assessments = evaluate(prev, cur);
      expect(assessments.filter(a => a.ruleId === "lead-reversal")).toHaveLength(0);
    });

    it("does not trigger when going from tied to leader", () => {
      const prev = basePacket({ minute: 60, score: { home: 0, away: 0 } });
      const cur = basePacket({ minute: 62, score: { home: 1, away: 0 } });
      const assessments = evaluate(prev, cur);
      expect(assessments.filter(a => a.ruleId === "lead-reversal")).toHaveLength(0);
    });
  });

  describe("multiple rules firing simultaneously", () => {
    it("all 4 rules can fire in one tick", () => {
      const prev = basePacket({
        minute: 60,
        score: { home: 1, away: 0 },
        events: [],
        oddsSnapshot: { home: 1.5, draw: 2.8, away: 1.5 },
      });
      const cur = basePacket({
        minute: 67,
        score: { home: 1, away: 2 },
        events: [
          { type: "card", minute: 67, team: "BRA", cardType: "red" },
          { type: "injury", minute: 67, team: "BRA" },
        ],
        oddsSnapshot: { home: 1.5, draw: 2.8, away: 1.95 },
        // swingAway = 0.45 > 0.18
        // lead reversed home->away
      });
      const assessments = evaluate(prev, cur, 1000);

      const ruleIds = assessments.map(a => a.ruleId).sort();
      expect(ruleIds).toEqual(["injury", "lead-reversal", "odds-swing", "red-card"]);
    });
  });

  describe("recommendedAction URL", () => {
    it("uses matchId from current packet", () => {
      const prev = basePacket({ matchId: "wc-final-123", events: [] });
      const cur = basePacket({
        matchId: "wc-final-456",
        events: [{ type: "injury", minute: 67 }],
      });
      const assessments = evaluate(prev, cur);
      expect(assessments[0].recommendedAction).toBe("/api/actions/hedge/wc-final-456");
    });
  });
});