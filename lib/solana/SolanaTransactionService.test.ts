import { describe, it, expect, vi, beforeEach } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { SolanaTransactionService } from "./SolanaTransactionService";

const TEST_ACCOUNT = new PublicKey("11111111111111111111111111111113");

vi.mock("@solana/web3.js", async () => {
  const actual = await vi.importActual("@solana/web3.js");
  return {
    ...actual,
    Connection: vi.fn().mockImplementation(() => ({
      getLatestBlockhash: () =>
        Promise.resolve({
          blockhash: "11111111111111111111111111111111",
          lastValidBlockHeight: 999,
        }),
      getRecentPrioritizationFees: () =>
        Promise.resolve([
          { slot: 1, prioritizationFee: 1000 },
          { slot: 2, prioritizationFee: 2000 },
        ]),
      getAccountInfo: () => Promise.resolve(null),
      simulateTransaction: () =>
        Promise.resolve({ value: { err: null } }),
    })),
  };
});

vi.mock("@solana/spl-token", async () => {
  const actual = await vi.importActual("@solana/spl-token");
  return {
    ...actual,
    getAssociatedTokenAddress: () =>
      Promise.resolve(new PublicKey("22222222222222222222222222222222222222222222")),
  };
});

describe("SolanaTransactionService", () => {
  let service: SolanaTransactionService;

  beforeEach(() => {
    vi.stubEnv("SPL_HEDGE_MINT_ADDRESS", "");
    vi.stubEnv("SPL_VAULT_SECRET_KEY", "");
    service = new SolanaTransactionService();
  });

  it("creates a SystemProgram transfer when SPL env vars are not set", async () => {
    const result = await service.createHedgeTransaction(TEST_ACCOUNT, "test-market");
    expect(result.transaction).toBeTruthy();
    expect(typeof result.transaction).toBe("string");
    expect(result.message).toContain("hedge");
  });

  it("includes correct base64 transaction format", async () => {
    const result = await service.createHedgeTransaction(TEST_ACCOUNT, "test-market");
    const decoded = Buffer.from(result.transaction, "base64");
    expect(decoded.length).toBeGreaterThan(0);
  });

  it("returns transaction for any valid public key", async () => {
    const key = new PublicKey("33333333333333333333333333333333333333333333");
    const result = await service.createHedgeTransaction(key, "match-1");
    expect(result.transaction).toBeTruthy();
  });

  it("simulateTransaction returns true for valid transaction", async () => {
    const { Transaction } = await import("@solana/web3.js");
    const transaction = new Transaction();
    const result = await service.simulateTransaction(transaction);
    expect(result).toBe(true);
  });

  it("creates SPL transfer when env vars are configured", async () => {
    const vaultKey = new Uint8Array(64).fill(1);
    vi.stubEnv("SPL_HEDGE_MINT_ADDRESS", "44444444444444444444444444444444444444444444");
    vi.stubEnv("SPL_VAULT_SECRET_KEY", Buffer.from(vaultKey).toString("base64"));

    const result = await service.createHedgeTransaction(TEST_ACCOUNT, "test-market");
    expect(result.transaction).toBeTruthy();
  });
});
