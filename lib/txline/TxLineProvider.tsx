"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";
import { createTxLineSseSource } from "./txLineSseSource";
import type { TxLineSource } from "./TxLineSource";
import { ConnectionEventBus } from "./txLineConnectionBus";
import { createMockTxLineSource } from "./mockData";
import { FIXTURE_IDS } from "./txLineFixtureIds";
import { ConnectionStatusProvider } from "./useConnectionStatus";

const DEFAULT_FIXTURE_ID = 18209181;

interface TxLineContextValue {
  packet: TxLineEventPacket | null;
  connectionBus: ConnectionEventBus;
}

const TxLineContext = createContext<TxLineContextValue | null>(null);

export function TxLineProvider({
  children,
  fixtureId,
  jwt,
  apiToken,
}: {
  children: ReactNode;
  fixtureId?: number;
  jwt: string;
  apiToken: string;
}) {
  const [packet, setPacket] = useState<TxLineEventPacket | null>(null);
  const [connectionBus] = useState(() => new ConnectionEventBus());
  type ManagedSource = TxLineSource & { stop?: () => void };
  const sourceRef = useRef<ManagedSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    sourceRef.current?.stop?.();

    const selectedFixture = FIXTURE_IDS.find((entry) => entry.fixtureId === fixtureId);
    const source = jwt === "demo-jwt"
      ? createMockTxLineSource({
          fixtureId: fixtureId ?? DEFAULT_FIXTURE_ID,
          homeTeam: selectedFixture?.homeTeam,
          awayTeam: selectedFixture?.awayTeam,
        })
      : createTxLineSseSource({
          jwt,
          apiToken,
          fixtureId: fixtureId ?? DEFAULT_FIXTURE_ID,
          onConnectionChange: (state, meta) => connectionBus.setState(state, meta),
        });
    const demoConnectionTimer = jwt === "demo-jwt"
      ? window.setTimeout(() => connectionBus.setState("connected"), 0)
      : null;
    sourceRef.current = source;
    const unsubscribe = source.subscribe((p) => {
      if (!cancelled) setPacket(p);
    });

    return () => {
      cancelled = true;
      if (demoConnectionTimer !== null) window.clearTimeout(demoConnectionTimer);
      sourceRef.current?.stop?.();
      sourceRef.current = null;
    };
  }, [connectionBus, fixtureId, jwt, apiToken]);

  return (
    <TxLineContext.Provider value={{ packet, connectionBus }}>
      <ConnectionStatusProvider connectionBus={connectionBus}>
        {children}
      </ConnectionStatusProvider>
    </TxLineContext.Provider>
  );
}

export function useTxLine(): TxLineEventPacket | null {
  const ctx = useContext(TxLineContext);
  return ctx?.packet ?? null;
}

export function useConnectionBus(): ConnectionEventBus {
  const ctx = useContext(TxLineContext);
  if (!ctx) throw new Error("useConnectionBus must be used within TxLineProvider");
  return ctx.connectionBus;
}
