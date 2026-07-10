import { describe, it, expect } from "vitest";
import {
  readSseMessages,
  parseScoreEvent,
  parseOddsEvent,
  mergeScoresAndOdds,
} from "./txLineSseAdapter";

async function collectMessages(body: string): Promise<any[]> {
  const response = new Response(body, {
    headers: { "Content-Type": "text/event-stream" },
  });
  const messages: any[] = [];
  for await (const msg of readSseMessages(response)) {
    messages.push(msg);
  }
  return messages;
}

describe("readSseMessages", () => {
  it("parses single event block", async () => {
    const msgs = await collectMessages("data: hello\n\n");
    expect(msgs).toHaveLength(1);
    expect(msgs[0].data).toBe("hello");
  });

  it("handles multiline data", async () => {
    const msgs = await collectMessages("data: line1\ndata: line2\n\n");
    expect(msgs).toHaveLength(1);
    expect(msgs[0].data).toBe("line1\nline2");
  });

  it("skips comment lines", async () => {
    const msgs = await collectMessages(": comment\ndata: real\n\n");
    expect(msgs).toHaveLength(1);
    expect(msgs[0].data).toBe("real");
  });

  it("parses event and id fields", async () => {
    const msgs = await collectMessages("event: score\ndata: {}\nid: 42\n\n");
    expect(msgs).toHaveLength(1);
    expect(msgs[0].event).toBe("score");
    expect(msgs[0].id).toBe("42");
    expect(msgs[0].data).toBe("{}");
  });

  it("handles multiple events", async () => {
    const msgs = await collectMessages("data: first\n\ndata: second\n\n");
    expect(msgs).toHaveLength(2);
    expect(msgs[0].data).toBe("first");
    expect(msgs[1].data).toBe("second");
  });
});

describe("parseScoreEvent", () => {
  it("returns expected partial shape", () => {
    const result = parseScoreEvent({
      matchId: "18209181",
      minute: 45,
      score: { home: 2, away: 1 },
      possession: { home: 55, away: 45 },
      events: [{ type: "goal", minute: 30, team: "France" }],
    });
    expect(result.matchId).toBe("18209181");
    expect(result.minute).toBe(45);
    expect(result.score).toEqual({ home: 2, away: 1 });
    expect(result.possession).toEqual({ home: 55, away: 45 });
    expect(result.events).toHaveLength(1);
  });

  it("returns defaults for missing fields", () => {
    const result = parseScoreEvent({});
    expect(result.score).toBeDefined();
    expect(result.possession).toBeDefined();
    expect(Array.isArray(result.events)).toBe(true);
  });

  it("returns empty for null input", () => {
    const result = parseScoreEvent(null);
    expect(result).toEqual({});
  });
});

describe("parseOddsEvent", () => {
  it("returns expected partial shape", () => {
    const result = parseOddsEvent({
      oddsSnapshot: { home: 1.5, draw: 3.2, away: 2.8 },
      consensus: { direction: "home", confidence: 0.75 },
    });
    expect(result.oddsSnapshot).toEqual({ home: 1.5, draw: 3.2, away: 2.8 });
    expect(result.consensus).toEqual({ direction: "home", confidence: 0.75 });
  });

  it("returns defaults for missing fields", () => {
    const result = parseOddsEvent({});
    expect(result.oddsSnapshot).toBeDefined();
    expect(result.consensus).toBeDefined();
  });
});

describe("mergeScoresAndOdds", () => {
  it("produces a valid TxLineEventPacket", () => {
    const packet = mergeScoresAndOdds(
      { matchId: "1", minute: 30, score: { home: 1, away: 0 }, possession: { home: 55, away: 45 }, events: [] },
      { oddsSnapshot: { home: 2.0, draw: 3.0, away: 1.5 }, consensus: { direction: "home", confidence: 0.7 } },
    );
    expect(packet.matchId).toBe("1");
    expect(packet.minute).toBe(30);
    expect(packet.score.home).toBe(1);
    expect(packet.oddsSnapshot.home).toBe(2.0);
    expect(packet.consensus.direction).toBe("home");
  });

  it("throws on invalid data", () => {
    expect(() =>
      mergeScoresAndOdds(
        { matchId: "1", minute: -5 } as any,
        {},
      ),
    ).toThrow();
  });
});
