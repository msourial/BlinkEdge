export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected" | "stale";

export interface ConnectionMeta {
  lastPacket?: number;
  retryCount?: number;
}

type Listener = (state: ConnectionState, meta?: ConnectionMeta) => void;

export class ConnectionEventBus {
  private _state: ConnectionState = "disconnected";
  private listeners = new Set<Listener>();

  get state(): ConnectionState {
    return this._state;
  }

  setState(state: ConnectionState, meta?: ConnectionMeta): void {
    this._state = state;
    this.listeners.forEach((listener) => listener(state, meta));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
