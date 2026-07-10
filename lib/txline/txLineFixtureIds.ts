export const DEVNET_ORIGIN = "https://txline-dev.txodds.com";
export const SSE_SCORES_PATH = "/api/scores/stream";
export const SSE_ODDS_PATH = "/api/odds/stream";
export const AUTH_PATH = "/auth/guest/start";
export const ACTIVATE_PATH = "/api/token/activate";

export const STALE_THRESHOLD_MS = 30_000;
export const MAX_RETRIES = 5;
export const STALE_CHECK_INTERVAL_MS = 5000;

export interface FixtureEntry {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoff: string;
}

export const FIXTURE_IDS: readonly FixtureEntry[] = [
  { fixtureId: 18209181, homeTeam: "France", awayTeam: "Morocco", competition: "World Cup 2026", kickoff: "2026-07-15T20:00:00Z" },
  { fixtureId: 18172489, homeTeam: "Brazil", awayTeam: "Japan", competition: "World Cup 2026", kickoff: "2026-07-14T18:00:00Z" },
  { fixtureId: 18175983, homeTeam: "Germany", awayTeam: "Paraguay", competition: "World Cup 2026", kickoff: "2026-07-16T16:00:00Z" },
] as const;
