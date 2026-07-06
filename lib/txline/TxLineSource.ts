import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";

export interface TxLineSource {
  subscribe(callback: (packet: TxLineEventPacket) => void): () => void;
}
