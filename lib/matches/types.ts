export type MatchStatus = "completed" | "live" | "upcoming";

export interface MatchScore {
  home: number;
  away: number;
  minute?: number;
}

export interface ArchiveMatchRecord {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  competition: string;
  stage?: string;
  status: "completed";
  finalScore: MatchScore;
  /** Identifies the export that supplied the final score for audit purposes. */
  source?: string;
}

export interface TxLineFixtureSnapshot {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  competition: string;
  stage?: string;
}

export interface NormalizedMatch extends TxLineFixtureSnapshot {
  homeCountryCode?: string;
  awayCountryCode?: string;
  status: MatchStatus;
  score?: MatchScore;
  source: "archive" | "txline" | "merged";
}

export interface MatchTimeline {
  matches: NormalizedMatch[];
  fetchedAt: string;
  source: "txline" | "cache" | "archive" | "schedule";
  stale: boolean;
  error?: string;
}
