import type { TxLineEventPacket, TxLineEvent } from "@/lib/schema/txLineSchema";
import type { TxLineSource } from "./TxLineSource";

class SeededPRNG {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

const MATCH_ID = "wc-2026-final";
const HOME_TEAM = "BRA";
const AWAY_TEAM = "ARG";
const SEED = 42;

const TEAM_NAMES = ["BRA", "ARG"];

function generatePacket(prng: SeededPRNG, minute: number, prevScore: { home: number; away: number }): TxLineEventPacket {
  const events: TxLineEvent[] = [];

  let score = { ...prevScore };

  if (minute === 67) {
    events.push({
      type: "card",
      minute: 67,
      team: AWAY_TEAM,
      player: "Player 8",
      cardType: "red",
    });
  }

  if (minute > 0 && minute % 22 === 0 && minute < 90) {
    const scoringTeam = prng.pick(TEAM_NAMES);
    if (scoringTeam === HOME_TEAM) score.home++;
    else score.away++;
    events.push({
      type: "goal",
      minute,
      team: scoringTeam,
    });
  }

  if (minute > 0 && minute % 30 === 0 && minute !== 60) {
    events.push({
      type: "injury",
      minute,
      team: prng.pick(TEAM_NAMES),
    });
  }

  if (minute % 5 === 0) {
    events.push({
      type: "odds_change",
      minute,
    });
  }

  const possessionHome = Math.round(prng.range(35, 65));
  const oddsBase = 1.5 + prng.range(0, 2);
  const consensusDirection = score.home > score.away ? "home" : score.away > score.home ? "away" : "draw";

  return {
    matchId: MATCH_ID,
    timestamp: Date.now(),
    minute,
    score,
    possession: {
      home: possessionHome,
      away: 100 - possessionHome,
    },
    events,
    oddsSnapshot: {
      home: parseFloat((oddsBase + (score.home > score.away ? -0.3 : 0.3)).toFixed(2)),
      draw: parseFloat((oddsBase + 0.5).toFixed(2)),
      away: parseFloat((oddsBase + (score.away > score.home ? -0.3 : 0.3)).toFixed(2)),
    },
    consensus: {
      direction: consensusDirection as "home" | "draw" | "away",
      confidence: parseFloat(prng.range(0.55, 0.85).toFixed(2)),
    },
  };
}

export function createMockTxLineSource(): TxLineSource {
  const subscribers = new Set<(packet: TxLineEventPacket) => void>();
  let interval: NodeJS.Timeout | null = null;
  let minute = 0;
  let currentScore = { home: 0, away: 0 };
  const prng = new SeededPRNG(SEED);

  const tick = () => {
    const packet = generatePacket(prng, minute, currentScore);
    currentScore = { ...packet.score };
    subscribers.forEach((cb) => cb(packet));
    minute = (minute + 2) % 122;
  };

  return {
    subscribe(callback: (packet: TxLineEventPacket) => void): () => void {
      subscribers.add(callback);
      if (interval === null) {
        tick();
        interval = setInterval(tick, 2000);
      }
      return () => {
        subscribers.delete(callback);
        if (subscribers.size === 0 && interval !== null) {
          clearInterval(interval);
          interval = null;
        }
      };
    },
  };
}
