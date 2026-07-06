"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";
import { createMockTxLineSource } from "./mockData";
import type { TxLineSource } from "./TxLineSource";

const TxLineContext = createContext<TxLineEventPacket | null>(null);

export function TxLineProvider({ children }: { children: ReactNode }) {
  const [packet, setPacket] = useState<TxLineEventPacket | null>(null);

  useEffect(() => {
    const source: TxLineSource = createMockTxLineSource();
    const unsubscribe = source.subscribe((p) => setPacket(p));
    return unsubscribe;
  }, []);

  return <TxLineContext.Provider value={packet}>{children}</TxLineContext.Provider>;
}

export function useTxLine(): TxLineEventPacket | null {
  return useContext(TxLineContext);
}
