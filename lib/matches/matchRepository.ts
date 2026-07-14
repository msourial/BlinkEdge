import { countryCodeForTeam } from "./countryCodes";
import type { ArchiveMatchRecord, MatchScore, MatchStatus, NormalizedMatch, TxLineFixtureSnapshot } from "./types";

const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function number(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function parseKickoff(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value < 100_000_000_000 ? value * 1_000 : value;
    return !Number.isNaN(new Date(timestamp).getTime()) ? new Date(timestamp).toISOString() : undefined;
  }
  const raw = text(value);
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return parseKickoff(Number(raw));
  return !Number.isNaN(Date.parse(raw)) ? new Date(raw).toISOString() : undefined;
}

function teamName(value: unknown): string | undefined {
  const direct = text(value);
  if (direct) return direct;
  const participant = asRecord(value);
  return participant ? text(participant.Name ?? participant.name ?? participant.ParticipantName) : undefined;
}

export function normalizeTxLineFixture(value: unknown): TxLineFixtureSnapshot | null {
  const row = asRecord(value);
  if (!row) return null;
  const fixtureId = number(row.FixtureId ?? row.fixtureId ?? row.id);
  const homeTeam = teamName(row.Participant1 ?? row.Participant1Name ?? row.homeTeam ?? row.home);
  const awayTeam = teamName(row.Participant2 ?? row.Participant2Name ?? row.awayTeam ?? row.away);
  const kickoff = parseKickoff(row.StartTime ?? row.startTime ?? row.kickoff ?? row.Ts ?? row.ts);
  const competition = text(row.Competition ?? row.competition) ?? "World Cup 2026";
  const stage = text(row.FixtureGroup ?? row.FixtureGroupName ?? row.stage);
  if (fixtureId === undefined || !homeTeam || !awayTeam || !kickoff) return null;
  return { fixtureId, homeTeam, awayTeam, kickoff, competition, stage };
}

export function normalizeTxLineSnapshot(payload: unknown): TxLineFixtureSnapshot[] {
  const collectRows = (candidate: unknown, depth = 0): unknown[] => {
    if (depth > 4) return [];
    if (Array.isArray(candidate)) return candidate.flatMap((row) => collectRows(row, depth + 1));
    const record = asRecord(candidate);
    if (!record) return [];
    if (record.FixtureId !== undefined || record.fixtureId !== undefined || record.id !== undefined) return [record];
    return Object.values(record).flatMap((row) => collectRows(row, depth + 1));
  };
  const rows = collectRows(payload);
  const unique = new Map<number, TxLineFixtureSnapshot>();
  for (const row of rows) {
    const fixture = normalizeTxLineFixture(row);
    if (fixture) unique.set(fixture.fixtureId, fixture);
  }
  return [...unique.values()];
}

/** Confirmed schedule used only when a live fixture snapshot cannot be decoded. */
export const CONFIRMED_UPCOMING_FIXTURES: readonly TxLineFixtureSnapshot[] = [
  { fixtureId: 18237038, homeTeam: "France", awayTeam: "Spain", kickoff: "2026-07-14T20:00:00Z", competition: "World Cup 2026", stage: "Semi-final" },
  { fixtureId: 18241006, homeTeam: "England", awayTeam: "Argentina", kickoff: "2026-07-15T20:00:00Z", competition: "World Cup 2026", stage: "Semi-final" },
];

export function matchStatusForKickoff(kickoff: string, now = Date.now()): MatchStatus {
  const time = Date.parse(kickoff);
  if (time > now) return "upcoming";
  if (now - time <= LIVE_WINDOW_MS) return "live";
  return "completed";
}

function normalized(fixture: TxLineFixtureSnapshot, status: MatchStatus, score: MatchScore | undefined, source: NormalizedMatch["source"]): NormalizedMatch {
  return {
    ...fixture,
    homeCountryCode: countryCodeForTeam(fixture.homeTeam),
    awayCountryCode: countryCodeForTeam(fixture.awayTeam),
    status,
    score,
    source,
  };
}

export function mergeMatches(archive: readonly ArchiveMatchRecord[], fixtures: readonly TxLineFixtureSnapshot[], now = Date.now()): NormalizedMatch[] {
  const archiveById = new Map(archive.map((match) => [match.fixtureId, match]));
  const merged = new Map<number, NormalizedMatch>();

  for (const fixture of fixtures) {
    const historical = archiveById.get(fixture.fixtureId);
    merged.set(fixture.fixtureId, historical
      ? normalized({ ...fixture, competition: historical.competition || fixture.competition, stage: historical.stage ?? fixture.stage }, "completed", historical.finalScore, "merged")
      : normalized(fixture, matchStatusForKickoff(fixture.kickoff, now), undefined, "txline"));
  }

  for (const historical of archive) {
    if (!merged.has(historical.fixtureId)) {
      merged.set(historical.fixtureId, normalized(historical, "completed", historical.finalScore, "archive"));
    }
  }

  return [...merged.values()].sort((left, right) => {
    const leftTime = Date.parse(left.kickoff);
    const rightTime = Date.parse(right.kickoff);
    if (left.status === "completed" && right.status === "completed") return rightTime - leftTime;
    if (left.status === "completed") return -1;
    if (right.status === "completed") return 1;
    if (left.status === "live" && right.status !== "live") return -1;
    if (right.status === "live" && left.status !== "live") return 1;
    return leftTime - rightTime;
  });
}
