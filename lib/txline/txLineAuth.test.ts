import { describe, expect, test } from "vitest";
import { extractApiToken } from "./txLineAuth";

describe("extractApiToken", () => {
  test("accepts the JSON token response", () => {
    expect(extractApiToken('{"token":"txoracle_ap_json"}')).toBe("txoracle_ap_json");
  });

  test("accepts the plain-text TxLINE token response", () => {
    expect(extractApiToken("txoracle_ap_plain\n")).toBe("txoracle_ap_plain");
  });

  test("rejects an empty or malformed token response", () => {
    expect(() => extractApiToken("")).toThrow("empty API token");
    expect(() => extractApiToken('{"token":null}')).toThrow("invalid API token response");
  });
});
