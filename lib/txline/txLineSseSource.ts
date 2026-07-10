import type { TxLineSource } from "./TxLineSource";
import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";
import { ConnectionEventBus, type ConnectionState, type ConnectionMeta } from "./txLineConnectionBus";
import {
  readSseMessages,
  parseScoreEvent,
  parseOddsEvent,
  mergeScoresAndOdds,
} from "./txLineSseAdapter";
import {
  DEVNET_ORIGIN,
  SSE_SCORES_PATH,
  SSE_ODDS_PATH,
  STALE_THRESHOLD_MS,
  MAX_RETRIES,
  STALE_CHECK_INTERVAL_MS,
} from "./txLineFixtureIds";

export interface SseSourceConfig {
  jwt: string;
  apiToken: string;
  fixtureId: number;
  onConnectionChange?: (state: ConnectionState, meta?: ConnectionMeta) => void;
}

export interface SseSource extends TxLineSource {
  connectionBus: ConnectionEventBus;
  stop: () => void;
}

type ParserFn = (data: unknown) => Partial<TxLineEventPacket>;

export function createTxLineSseSource(
  config: SseSourceConfig,
): SseSource {
  const connectionBus = new ConnectionEventBus();
  const subscribers = new Set<(packet: TxLineEventPacket) => void>();
  const mergedState: Partial<TxLineEventPacket> = {};
  let lastPacketTime = 0;
  let abortController: AbortController | null = null;
  let staleInterval: ReturnType<typeof setInterval> | null = null;
  let isRunning = false;

  const scoresUrl = `${DEVNET_ORIGIN}${SSE_SCORES_PATH}`;
  const oddsUrl = `${DEVNET_ORIGIN}${SSE_ODDS_PATH}`;

  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
    Authorization: `Bearer ${config.jwt}`,
    "X-Api-Token": config.apiToken,
  };

  function notifyConnectionState(state: ConnectionState, meta?: ConnectionMeta): void {
    connectionBus.setState(state, meta);
    config.onConnectionChange?.(state, meta);
  }

  async function connectAndRead(
    url: string,
    parser: ParserFn,
  ): Promise<void> {
    const response = await fetch(url, { headers, signal: abortController!.signal });
    if (!response.ok) {
      throw new Error(`SSE connection failed (${response.status}): ${url}`);
    }

    notifyConnectionState("connected");

    for await (const message of readSseMessages(response)) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(message.data);
      } catch {
        continue;
      }

      const partial = parser(parsed);
      Object.assign(mergedState, partial);

      try {
        const packet = mergeScoresAndOdds(mergedState, {});
        lastPacketTime = Date.now();
        subscribers.forEach((cb) => cb(packet));
      } catch {
        // Incomplete data — wait for next packet from other stream
      }
    }
  }

  async function connectWithRetry(): Promise<void> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      notifyConnectionState(attempt === 0 ? "connecting" : "reconnecting", { retryCount: attempt });
      abortController = new AbortController();

      try {
        await Promise.all([
          connectAndRead(scoresUrl, parseScoreEvent),
          connectAndRead(oddsUrl, parseOddsEvent),
        ]);
        return;
      } catch (err) {
        if (abortController?.signal.aborted) break;

        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 8000);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    notifyConnectionState("disconnected");
  }

  function startStaleDetection(): void {
    staleInterval = setInterval(() => {
      if (lastPacketTime > 0 && Date.now() - lastPacketTime > STALE_THRESHOLD_MS) {
        notifyConnectionState("stale", { lastPacket: lastPacketTime });
      }
    }, STALE_CHECK_INTERVAL_MS);
  }

  function stop(): void {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    if (staleInterval !== null) {
      clearInterval(staleInterval);
      staleInterval = null;
    }
    isRunning = false;
  }

  return {
    connectionBus,
    stop,
    subscribe(callback: (packet: TxLineEventPacket) => void): () => void {
      subscribers.add(callback);

      if (!isRunning) {
        isRunning = true;
        connectWithRetry();
        startStaleDetection();
      }

      return () => {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          stop();
        }
      };
    },
  };
}
