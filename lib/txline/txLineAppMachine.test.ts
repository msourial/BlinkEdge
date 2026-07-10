import { describe, it, expect } from "vitest";
import { appStateReducer, INITIAL_APP_STATE } from "./txLineAppMachine";

const testMatch = { matchId: 42, homeTeam: "France", awayTeam: "Morocco" };

describe("appStateReducer", () => {
  it("LOADING + LOADED -> MATCH_SELECT", () => {
    const result = appStateReducer({ phase: "LOADING" }, { type: "LOADED" });
    expect(result).toEqual({ phase: "MATCH_SELECT" });
  });

  it("LOADING + API_ERROR -> API_ERROR", () => {
    const result = appStateReducer({ phase: "LOADING" }, { type: "API_ERROR", error: "test error" });
    expect(result).toEqual({ phase: "API_ERROR", error: "test error" });
  });

  it("MATCH_SELECT + SELECT_MATCH -> CAMERA_INIT with match", () => {
    const result = appStateReducer({ phase: "MATCH_SELECT" }, { type: "SELECT_MATCH", match: testMatch });
    expect(result).toEqual({ phase: "CAMERA_INIT", selectedMatch: testMatch });
  });

  it("CAMERA_INIT + CAMERA_READY -> AR_HUD_LIVE with same match", () => {
    const result = appStateReducer({ phase: "CAMERA_INIT", selectedMatch: testMatch }, { type: "CAMERA_READY" });
    expect(result).toEqual({ phase: "AR_HUD_LIVE", selectedMatch: testMatch });
  });

  it("AR_HUD_LIVE + GO_BACK -> MATCH_SELECT", () => {
    const result = appStateReducer({ phase: "AR_HUD_LIVE", selectedMatch: testMatch }, { type: "GO_BACK" });
    expect(result).toEqual({ phase: "MATCH_SELECT" });
  });

  it("API_ERROR + RETRY -> LOADING", () => {
    const result = appStateReducer({ phase: "API_ERROR", error: "test" }, { type: "RETRY" });
    expect(result).toEqual({ phase: "LOADING" });
  });

  it("OFFLINE + RETRY -> LOADING", () => {
    const result = appStateReducer({ phase: "OFFLINE" }, { type: "RETRY" });
    expect(result).toEqual({ phase: "LOADING" });
  });

  it("API_ERROR + GO_BACK -> MATCH_SELECT", () => {
    const result = appStateReducer({ phase: "API_ERROR", error: "test" }, { type: "GO_BACK" });
    expect(result).toEqual({ phase: "MATCH_SELECT" });
  });

  it("unknown transitions return state unchanged", () => {
    const result = appStateReducer({ phase: "MATCH_SELECT" }, { type: "CAMERA_READY" });
    expect(result).toEqual({ phase: "MATCH_SELECT" });
  });

  it("INITIAL_APP_STATE is LOADING", () => {
    expect(INITIAL_APP_STATE).toEqual({ phase: "LOADING" });
  });
});
