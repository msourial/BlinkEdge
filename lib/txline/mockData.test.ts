import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockTxLineSource } from "./mockData";
import { txLineEventPacketSchema } from "@/lib/schema/txLineSchema";
import type { TxLineEventPacket } from "@/lib/schema/txLineSchema";



describe("createMockTxLineSource", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function collect(source: ReturnType<typeof createMockTxLineSource>, count: number): Promise<TxLineEventPacket[]> {
    return new Promise((resolve) => {
      const collected: TxLineEventPacket[] = [];
      source.subscribe((packet) => {
        collected.push(packet);
        if (collected.length === count) {
          resolve(collected);
        }
      });
    });
  }

  it("emits a packet immediately on subscribe (minute 0)", async () => {
    const source = createMockTxLineSource();
    const packets = await collect(source, 1);
    expect(packets).toHaveLength(1);
    expect(packets[0].minute).toBe(0);
    expect(packets[0].matchId).toBe("wc-2026-final");
    source.subscribe(() => {})(); // ensure no leak
  });

  it("increments minute by 2 each tick", async () => {
    const source = createMockTxLineSource();
    const promise = collect(source, 3);
    await vi.advanceTimersByTimeAsync(2 * 2000 + 100);
    const packets = await promise;
    expect(packets[0].minute).toBe(0);
    expect(packets[1].minute).toBe(2);
    expect(packets[2].minute).toBe(4);
  });

  it("all emitted packets pass schema validation", async () => {
    const source = createMockTxLineSource();
    const promise = collect(source, 10);
    await vi.advanceTimersByTimeAsync(9 * 2000 + 100);
    const packets = await promise;
    for (const packet of packets) {
      expect(() => txLineEventPacketSchema.parse(packet)).not.toThrow();
    }
  });

  it("never emits minute 67 (red card rule fires only on direct injection; mock minute is even-only)", async () => {
    const source = createMockTxLineSource();
    const promise = collect(source, 50);
    await vi.advanceTimersByTimeAsync(49 * 2000 + 100);
    const packets = await promise;
    const minutes = packets.map(p => p.minute);
    expect(minutes.every(m => m % 2 === 0)).toBe(true);
    expect(minutes).not.toContain(67);
  });

  it("emits goals on minute % 22 === 0 (minutes 0, 22, 44)", async () => {
    const source = createMockTxLineSource();
    const promise = collect(source, 23);
    await vi.advanceTimersByTimeAsync(22 * 2000 + 100);
    const packets = await promise;
    const minute22 = packets.find(p => p.minute === 22);
    const minute44 = packets.find(p => p.minute === 44);
    expect(minute22?.events.some(e => e.type === "goal")).toBe(true);
    expect(minute44?.events.some(e => e.type === "goal")).toBe(true);
  });

  it("emits injuries on minute % 30 === 0 (excluding 60)", async () => {
    const source = createMockTxLineSource();
    const promise = collect(source, 16);
    await vi.advanceTimersByTimeAsync(15 * 2000 + 100);
    const packets = await promise;
    const minute30 = packets.find(p => p.minute === 30);
    expect(minute30?.events.some(e => e.type === "injury")).toBe(true);
  });

  it("wraps minute around 122 (118 → 120 → 0)", async () => {
    const source = createMockTxLineSource();
    // minute 0..120 = 61 packets, packet 62 wraps to 0
    const promise = collect(source, 62);
    await vi.advanceTimersByTimeAsync(61 * 2000 + 100);
    const packets = await promise;
    const lastThree = packets.slice(-3).map(p => p.minute);
    expect(lastThree[0]).toBe(118);
    expect(lastThree[1]).toBe(120);
    expect(lastThree[2]).toBe(0);
  });

  it("possession values always sum to 100", async () => {
    const source = createMockTxLineSource();
    const promise = collect(source, 5);
    await vi.advanceTimersByTimeAsync(4 * 2000 + 100);
    const packets = await promise;
    for (const p of packets) {
      expect(p.possession.home + p.possession.away).toBe(100);
    }
  });

  it("consensus direction matches score leader", async () => {
    const source = createMockTxLineSource();
    const promise = collect(source, 30);
    await vi.advanceTimersByTimeAsync(29 * 2000 + 100);
    const packets = await promise;
    for (const p of packets) {
      if (p.score.home > p.score.away) expect(p.consensus.direction).toBe("home");
      else if (p.score.away > p.score.home) expect(p.consensus.direction).toBe("away");
      else expect(p.consensus.direction).toBe("draw");
    }
  });

  it("is deterministic with the same seed (same possession + odds at same minute)", async () => {
    const sourceA = createMockTxLineSource();
    const promiseA = collect(sourceA, 3);
    await vi.advanceTimersByTimeAsync(2 * 2000 + 100);
    const packetsA = await promiseA;

    const sourceB = createMockTxLineSource();
    const promiseB = collect(sourceB, 3);
    await vi.advanceTimersByTimeAsync(2 * 2000 + 100);
    const packetsB = await promiseB;

    expect(packetsA[1].possession).toEqual(packetsB[1].possession);
    expect(packetsA[1].oddsSnapshot).toEqual(packetsB[1].oddsSnapshot);
  });

  it("supports multiple subscribers receiving the same interval packets", async () => {
    const source = createMockTxLineSource();
    const collectedA: TxLineEventPacket[] = [];
    const collectedB: TxLineEventPacket[] = [];
    // First subscribe triggers immediate tick (minute 0) + starts interval
    source.subscribe((p) => collectedA.push(p));
    // Second subscribe does NOT trigger immediate tick (only the first one does),
    // but receives subsequent interval packets
    source.subscribe((p) => collectedB.push(p));
    await vi.advanceTimersByTimeAsync(2 * 2000 + 100);
    // A got: minute 0 (immediate), minute 2, minute 4 = 3 packets
    expect(collectedA.length).toBe(3);
    // B got: minute 2, minute 4 = 2 packets (missed the immediate one)
    expect(collectedB.length).toBe(2);
    // Both share the interval packets
    expect(collectedA[1]).toEqual(collectedB[0]);
    expect(collectedA[2]).toEqual(collectedB[1]);
  });

  it("stops ticking when all subscribers unsubscribe", async () => {
    const source = createMockTxLineSource();
    let count = 0;
    const unsub = source.subscribe(() => count++);
    await vi.advanceTimersByTimeAsync(2 * 2000 + 100);
    expect(count).toBe(3);
    unsub();
    const countAfterUnsub = count;
    await vi.advanceTimersByTimeAsync(5 * 2000);
    expect(count).toBe(countAfterUnsub);
  });
});