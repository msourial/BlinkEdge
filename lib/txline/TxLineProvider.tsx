"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";
import { createTxLineSseSource, type SseSource } from "./txLineSseSource";
import { ConnectionEventBus } from "./txLineConnectionBus";

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
  const sourceRef = useRef<SseSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (sourceRef.current) {
      sourceRef.current.stop();
    }

    const source = createTxLineSseSource({
      jwt,
      apiToken,
      fixtureId: fixtureId ?? DEFAULT_FIXTURE_ID,
      onConnectionChange: (state, meta) => connectionBus.setState(state, meta),
    });
    sourceRef.current = source;
    const unsubscribe = source.subscribe((p) => {
      if (!cancelled) setPacket(p);
    });

    return () => {
      cancelled = true;
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
    };
  }, [connectionBus, fixtureId, jwt, apiToken]);

  return (
    <TxLineContext.Provider value={{ packet, connectionBus }}>
      {children}
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
