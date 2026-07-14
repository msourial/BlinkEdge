"use client";

import { useCallback, useEffect, useState } from "react";
import archive from "@/data/txodds-world-cup-history.json";
import { DEVNET_ORIGIN } from "@/lib/txline/txLineFixtureIds";
import { CONFIRMED_UPCOMING_FIXTURES, mergeMatches, normalizeTxLineSnapshot } from "./matchRepository";
import type { ArchiveMatchRecord, MatchTimeline } from "./types";

const CACHE_KEY = "blinkedge.match-timeline.v1";
const STALE_AFTER_MS = 15 * 60 * 1000;
const archiveRecords = archive as ArchiveMatchRecord[];

function archiveTimeline(error?: string): MatchTimeline {
  return {
    matches: mergeMatches(archiveRecords, CONFIRMED_UPCOMING_FIXTURES),
    fetchedAt: new Date().toISOString(),
    source: error ? "schedule" : "archive",
    stale: false,
    error,
  };
}

function readCache(): MatchTimeline | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as MatchTimeline;
    if (!Array.isArray(value.matches) || !value.fetchedAt) return null;
    return { ...value, source: "cache", stale: Date.now() - Date.parse(value.fetchedAt) > STALE_AFTER_MS };
  } catch {
    return null;
  }
}

export function useMatchTimeline(jwt?: string, apiToken?: string) {
  const [timeline, setTimeline] = useState<MatchTimeline>(() => archiveTimeline());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!jwt || !apiToken) {
      setTimeline(archiveTimeline("Connect TxLINE to refresh current fixtures."));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${DEVNET_ORIGIN}/api/fixtures/snapshot`, {
        headers: { Authorization: `Bearer ${jwt}`, "X-Api-Token": apiToken },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Fixture snapshot unavailable (${response.status})`);
      const fixtures = normalizeTxLineSnapshot(await response.json());
      if (fixtures.length === 0) throw new Error("TxLINE fixture format was unavailable; showing the confirmed schedule.");
      const next: MatchTimeline = {
        matches: mergeMatches(archiveRecords, [...fixtures, ...CONFIRMED_UPCOMING_FIXTURES]),
        fetchedAt: new Date().toISOString(),
        source: "txline",
        stale: false,
      };
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      setTimeline(next);
    } catch (cause) {
      const cached = readCache();
      const message = cause instanceof Error ? cause.message : "Could not refresh fixtures.";
      setTimeline(cached ? { ...cached, error: `${message} Showing the last saved list.` } : archiveTimeline(message));
    } finally {
      setIsLoading(false);
    }
  }, [apiToken, jwt]);

  useEffect(() => {
    const cached = readCache();
    if (cached) setTimeline(cached);
    void refresh();
  }, [refresh]);

  return { timeline, isLoading, refresh };
}
