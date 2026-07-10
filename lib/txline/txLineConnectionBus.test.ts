import { describe, it, expect, vi } from "vitest";
import { ConnectionEventBus } from "./txLineConnectionBus";

describe("ConnectionEventBus", () => {
  it("starts in disconnected state", () => {
    const bus = new ConnectionEventBus();
    expect(bus.state).toBe("disconnected");
  });

  it("setState updates state and notifies listener", () => {
    const bus = new ConnectionEventBus();
    const listener = vi.fn();
    bus.subscribe(listener);
    bus.setState("connecting");
    expect(bus.state).toBe("connecting");
    expect(listener).toHaveBeenCalledWith("connecting", undefined);
  });

  it("subscribe returns unsubscribe that removes listener", () => {
    const bus = new ConnectionEventBus();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe(listener);
    unsubscribe();
    bus.setState("connected");
    expect(listener).not.toHaveBeenCalled();
  });

  it("multiple listeners all receive notifications", () => {
    const bus = new ConnectionEventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.subscribe(a);
    bus.subscribe(b);
    bus.setState("disconnected");
    expect(a).toHaveBeenCalledWith("disconnected", undefined);
    expect(b).toHaveBeenCalledWith("disconnected", undefined);
  });

  it("meta object passed through to listener", () => {
    const bus = new ConnectionEventBus();
    const listener = vi.fn();
    bus.subscribe(listener);
    const meta = { retryCount: 2 };
    bus.setState("reconnecting", meta);
    expect(listener).toHaveBeenCalledWith("reconnecting", meta);
  });
});
