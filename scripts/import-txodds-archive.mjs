#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/import-txodds-archive.mjs <TxODDS-export.csv|json>");
  process.exit(1);
}

function parseCsv(source) {
  const [headerLine, ...lines] = source.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim());
  return lines.filter(Boolean).map((line) => {
    const columns = line.match(/(?:[^,"]+|"[^"]*")+/g) ?? [];
    return Object.fromEntries(headers.map((header, index) => [header, (columns[index] ?? "").replace(/^"|"$/g, "").trim()]));
  });
}

function value(row, ...keys) {
  for (const key of keys) if (row[key] !== undefined && row[key] !== "") return row[key];
}

function validRow(row) {
  const fixtureId = Number(value(row, "fixtureId", "FixtureId", "fixture_id"));
  const home = value(row, "homeTeam", "Participant1", "HomeTeam");
  const away = value(row, "awayTeam", "Participant2", "AwayTeam");
  const kickoff = value(row, "kickoff", "StartTime", "startTime");
  const nestedScore = row.finalScore && typeof row.finalScore === "object" ? row.finalScore : {};
  const homeScore = Number(value(row, "homeScore", "HomeScore", "scoreHome") ?? nestedScore.home);
  const awayScore = Number(value(row, "awayScore", "AwayScore", "scoreAway") ?? nestedScore.away);
  const status = String(value(row, "status", "Status") ?? "").toLowerCase();
  if (!Number.isInteger(fixtureId) || !home || !away || !kickoff || Number.isNaN(Date.parse(kickoff)) || !Number.isInteger(homeScore) || !Number.isInteger(awayScore) || !["completed", "final", "finished"].includes(status)) return null;
  return {
    fixtureId,
    homeTeam: String(home),
    awayTeam: String(away),
    kickoff: new Date(kickoff).toISOString(),
    competition: String(value(row, "competition", "Competition") ?? "World Cup 2026"),
    stage: value(row, "stage", "FixtureGroup", "FixtureGroupName"),
    status: "completed",
    finalScore: { home: homeScore, away: awayScore },
    source: "TxODDS archive import",
  };
}

const raw = await readFile(resolve(input), "utf8");
const parsed = input.toLowerCase().endsWith(".json") ? JSON.parse(raw) : parseCsv(raw);
const rows = Array.isArray(parsed) ? parsed : parsed.matches ?? parsed.fixtures ?? [];
const accepted = [];
const rejected = [];
const seen = new Map();

for (const row of rows) {
  const normalized = validRow(row);
  if (!normalized) {
    rejected.push({ row, reason: "Missing or invalid fixture ID, teams, kickoff, final score, or completed status" });
    continue;
  }
  const existing = seen.get(normalized.fixtureId);
  if (existing) {
    rejected.push({ row, reason: JSON.stringify(existing.finalScore) === JSON.stringify(normalized.finalScore) ? "Duplicate fixture ID" : "Conflicting final score for fixture ID" });
    continue;
  }
  seen.set(normalized.fixtureId, normalized);
  accepted.push(normalized);
}

accepted.sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff));
await writeFile(resolve("data/txodds-world-cup-history.json"), `${JSON.stringify(accepted, null, 2)}\n`);
await writeFile(resolve("data/txodds-world-cup-history.audit.json"), `${JSON.stringify({ importedAt: new Date().toISOString(), accepted: accepted.length, rejected }, null, 2)}\n`);
console.log(`Imported ${accepted.length} completed matches; rejected ${rejected.length}.`);
