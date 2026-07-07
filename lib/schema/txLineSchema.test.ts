import { describe, it, expect } from "vitest";
import { txLineEventPacketSchema, txLineEventSchema } from "./txLineSchema";

const validPacket = {
  matchId: "wc-2026-final",
  timestamp: Date.now(),
  minute: 45,
  score: { home: 1, away: 0 },
  possession: { home: 60, away: 40 },
  events: [{ type: "goal", minute: 30, team: "BRA", player: "Vinicius" }],
  oddsSnapshot: { home: 1.5, draw: 2.8, away: 1.5 },
  consensus: { direction: "home", confidence: 0.7 },
};

describe("txLineEventSchema", () => {
  it("validates a goal event", () => {
    const ev = { type: "goal", minute: 30, team: "BRA", player: "Vinicius" };
    expect(txLineEventSchema.parse(ev)).toEqual(ev);
  });

  it("rejects unknown event type", () => {
    const ev = { type: "penalty", minute: 30 };
    expect(() => txLineEventSchema.parse(ev)).toThrow();
  });

  it("rejects minute > 120", () => {
    expect(() => txLineEventSchema.parse({ type: "goal", minute: 121 })).toThrow();
  });

  it("rejects minute < 0", () => {
    expect(() => txLineEventSchema.parse({ type: "goal", minute: -1 })).toThrow();
  });

  it("accepts valid card types", () => {
    expect(txLineEventSchema.parse({ type: "card", minute: 50, cardType: "yellow" }).cardType).toBe("yellow");
    expect(txLineEventSchema.parse({ type: "card", minute: 50, cardType: "red" }).cardType).toBe("red");
  });

  it("accepts card event without cardType", () => {
    expect(txLineEventSchema.parse({ type: "card", minute: 50 }).cardType).toBeUndefined();
  });
});

describe("txLineEventPacketSchema", () => {
  it("validates a well-formed packet", () => {
    expect(() => txLineEventPacketSchema.parse(validPacket)).not.toThrow();
  });

  it("rejects odds < 1 (bookmaker odds never below 1)", () => {
    const bad = { ...validPacket, oddsSnapshot: { home: 0.9, draw: 2.8, away: 1.5 } };
    expect(() => txLineEventPacketSchema.parse(bad)).toThrow();
  });

  it("rejects possession outside 0-100", () => {
    const bad = { ...validPacket, possession: { home: 110, away: -10 } };
    expect(() => txLineEventPacketSchema.parse(bad)).toThrow();
  });

  it("rejects confidence > 1", () => {
    const bad = { ...validPacket, consensus: { direction: "home", confidence: 1.5 } };
    expect(() => txLineEventPacketSchema.parse(bad)).toThrow();
  });

  it("rejects unknown consensus direction", () => {
    const bad = { ...validPacket, consensus: { direction: "neutral", confidence: 0.5 } };
    expect(() => txLineEventPacketSchema.parse(bad)).toThrow();
  });

  it("accepts empty events array", () => {
    const empty = { ...validPacket, events: [] };
    expect(() => txLineEventPacketSchema.parse(empty)).not.toThrow();
  });

  it("rejects negative home score", () => {
    const bad = { ...validPacket, score: { home: -1, away: 0 } };
    expect(() => txLineEventPacketSchema.parse(bad)).toThrow();
  });

  it("strips unknown fields by default (Zod 4 stripping)", () => {
    const extra = { ...validPacket, unknownField: "bad" };
    const parsed = txLineEventPacketSchema.parse(extra);
    expect(parsed).not.toHaveProperty("unknownField");
  });
});