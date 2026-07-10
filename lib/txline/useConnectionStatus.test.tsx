// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { type ReactNode } from "react";
import { ConnectionStatusProvider, useConnectionStatus } from "./useConnectionStatus";
import { ConnectionEventBus } from "./txLineConnectionBus";

function createWrapper(bus: ConnectionEventBus) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ConnectionStatusProvider connectionBus={bus}>
        {children}
      </ConnectionStatusProvider>
    );
  };
}

describe("useConnectionStatus", () => {
  it("initially provides disconnected", () => {
    const bus = new ConnectionEventBus();
    const { result } = renderHook(() => useConnectionStatus(), {
      wrapper: createWrapper(bus),
    });
    expect(result.current).toBe("disconnected");
  });

  it("updates when connectionBus state changes", () => {
    const bus = new ConnectionEventBus();
    const { result } = renderHook(() => useConnectionStatus(), {
      wrapper: createWrapper(bus),
    });

    act(() => {
      bus.setState("connected");
    });
    expect(result.current).toBe("connected");

    act(() => {
      bus.setState("disconnected");
    });
    expect(result.current).toBe("disconnected");
  });
});
