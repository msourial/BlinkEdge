import { txLineEventPacketSchema, type TxLineEventPacket } from "@/lib/schema/txLineSchema";

export interface SseMessage {
  data: string;
  event?: string;
  id?: string;
  retry?: number;
}

export async function* readSseMessages(response: Response): AsyncGenerator<SseMessage> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        const msg: SseMessage = { data: "" };
        const lines = trimmed.split("\n");

        for (const line of lines) {
          if (line.startsWith(":")) continue;

          const colonIdx = line.indexOf(":");
          let field: string;
          let value: string;
          if (colonIdx === -1) {
            field = line;
            value = "";
          } else {
            field = line.slice(0, colonIdx);
            value = line.slice(colonIdx + 1);
            if (value.startsWith(" ")) value = value.slice(1);
          }

          switch (field) {
            case "event":
              msg.event = value;
              break;
            case "data":
              msg.data = msg.data ? msg.data + "\n" + value : value;
              break;
            case "id":
              msg.id = value;
              break;
            case "retry":
              msg.retry = parseInt(value, 10);
              break;
          }
        }

        if (msg.data !== "") {
          yield msg;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function parseScoreEvent(data: unknown): Partial<TxLineEventPacket> {
  if (typeof data !== "object" || data === null) return {};
  const d = data as Record<string, unknown>;
  const s = d as Record<string, Record<string, unknown>>;

  return {
    matchId: String(d.matchId ?? d.fixture_id ?? ""),
    timestamp: Date.now(),
    minute: Number(d.minute ?? 0),
    score: {
      home: Number(s.score?.home ?? s.home_score ?? 0),
      away: Number(s.score?.away ?? s.away_score ?? 0),
    },
    possession: {
      home: Number(s.possession?.home ?? 50),
      away: Number(s.possession?.away ?? 50),
    },
    events: Array.isArray(d.events) ? d.events : [],
  };
}

export function parseOddsEvent(data: unknown): Partial<TxLineEventPacket> {
  if (typeof data !== "object" || data === null) return {};
  const d = data as Record<string, Record<string, unknown>>;

  const oddsSnapshot = {
    home: Number(d.oddsSnapshot?.home ?? d.home_odds ?? 2.0),
    draw: Number(d.oddsSnapshot?.draw ?? d.draw_odds ?? 3.0),
    away: Number(d.oddsSnapshot?.away ?? d.away_odds ?? 2.0),
  };

  const consensus = {
    direction: (d.consensus?.direction ?? "draw") as "home" | "draw" | "away",
    confidence: Number(d.consensus?.confidence ?? 0.6),
  };

  return {
    oddsSnapshot,
    consensus,
  };
}

export function mergeScoresAndOdds(
  scores: Partial<TxLineEventPacket>,
  odds: Partial<TxLineEventPacket>,
): TxLineEventPacket {
  const packet = {
    matchId: scores.matchId ?? odds.matchId ?? "",
    timestamp: scores.timestamp ?? odds.timestamp ?? Date.now(),
    minute: scores.minute ?? 0,
    score: scores.score ?? { home: 0, away: 0 },
    possession: scores.possession ?? { home: 50, away: 50 },
    events: scores.events ?? [],
    oddsSnapshot: odds.oddsSnapshot ?? { home: 2.0, draw: 3.0, away: 2.0 },
    consensus: odds.consensus ?? { direction: "draw" as const, confidence: 0.6 },
  };
  return txLineEventPacketSchema.parse(packet);
}
