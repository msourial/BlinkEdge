"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type ConnectionState, ConnectionEventBus } from "./txLineConnectionBus";

export const ConnectionStatusContext = createContext<ConnectionState>("disconnected");
export const ConnectionBusContext = createContext<ConnectionEventBus | null>(null);

export function ConnectionStatusProvider({
  children,
  connectionBus,
}: {
  children: ReactNode;
  connectionBus: ConnectionEventBus;
}) {
  const [state, setState] = useState<ConnectionState>(() => connectionBus.state);

  useEffect(() => {
    return connectionBus.subscribe((newState) => setState(newState));
  }, [connectionBus]);

  return (
    <ConnectionBusContext.Provider value={connectionBus}>
      <ConnectionStatusContext.Provider value={state}>
        {children}
      </ConnectionStatusContext.Provider>
    </ConnectionBusContext.Provider>
  );
}

export function useConnectionStatus(): ConnectionState {
  return useContext(ConnectionStatusContext);
}

export function useConnectionBus(): ConnectionEventBus {
  const bus = useContext(ConnectionBusContext);
  if (!bus) throw new Error("useConnectionBus must be used within ConnectionStatusProvider");
  return bus;
}
