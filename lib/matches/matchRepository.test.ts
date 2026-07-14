import { describe, expect, it } from "vitest";
import { CONFIRMED_UPCOMING_FIXTURES, mergeMatches, normalizeTxLineSnapshot } from "./matchRepository";
import type { ArchiveMatchRecord } from "./types";

const archive: ArchiveMatchRecord[] = [{
  fixtureId: 1, homeTeam: "France", awayTeam: "Morocco", kickoff: "2026-07-09T20:00:00Z",
  competition: "World Cup 2026", status: "completed", finalScore: { home: 2, away: 0 },
}];

describe("matchRepository", () => {
  it("normalizes TxLINE's documented fixture snapshot fields", () => {
    expect(normalizeTxLineSnapshot({ fixtures: [{ FixtureId: 2, Participant1: "Spain", Participant2: "Belgium", StartTime: "2026-07-14T20:00:00Z", Competition: "World Cup 2026" }] })).toEqual([
      { fixtureId: 2, homeTeam: "Spain", awayTeam: "Belgium", kickoff: "2026-07-14T20:00:00.000Z", competition: "World Cup 2026", stage: undefined },
    ]);
  });

  it("accepts capitalized TxLINE payload wrappers and retains the confirmed upcoming schedule", () => {
    expect(normalizeTxLineSnapshot({ Data: { Fixtures: [{ FixtureId: 3, Participant1: "France", Participant2: "Spain", StartTime: "2026-07-14T20:00:00Z" }] } })).toHaveLength(1);
    expect(CONFIRMED_UPCOMING_FIXTURES.map((fixture) => fixture.fixtureId)).toEqual([18237038, 18241006]);
  });

  it("keeps imported final scores authoritative and sorts completed newest first", () => {
    const matches = mergeMatches(archive, [{ fixtureId: 2, homeTeam: "Spain", awayTeam: "Belgium", kickoff: "2026-07-14T20:00:00Z", competition: "World Cup 2026" }], Date.parse("2026-07-14T21:00:00Z"));
    expect(matches.find((match) => match.fixtureId === 1)).toMatchObject({ fixtureId: 1, status: "completed", score: { home: 2, away: 0 }, source: "archive" });
    expect(matches.find((match) => match.fixtureId === 2)).toMatchObject({ fixtureId: 2, status: "live" });
  });
});
