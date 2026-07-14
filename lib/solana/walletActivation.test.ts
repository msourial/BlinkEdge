import { describe, expect, test } from "vitest";
import { DEVNET_REQUIRED_MESSAGE, formatWalletActivationError, isWalletApprovalRejected, shortenPublicKey } from "./walletActivation";

describe("formatWalletActivationError", () => {
  test("formats wallet approval rejection as a retryable action", () => {
    expect(formatWalletActivationError(new Error("User rejected the request."))).toBe(
      "Wallet approval was cancelled. Choose Activate free data feed to try again."
    );
  });

  test("recognizes wallet approval rejection without treating it as an application failure", () => {
    expect(isWalletApprovalRejected(new Error("User rejected the request."))).toBe(true);
    expect(isWalletApprovalRejected(new Error("Transaction simulation failed"))).toBe(false);
  });

  test("formats Devnet RPC failures", () => {
    expect(formatWalletActivationError(new Error("failed to fetch"))).toBe(
      "Could not reach Solana Devnet. Check your connection, then try again."
    );
  });

  test("formats TxLINE program failures", () => {
    expect(formatWalletActivationError(new Error("Transaction simulation failed: custom program error"))).toBe(
      "TxLINE could not complete the Devnet subscription transaction. Confirm your wallet is on Devnet and try again."
    );
  });

  test("explains the legacy missing TxLINE token account failure", () => {
    expect(formatWalletActivationError(new Error("AnchorError: user_token_account AccountNotInitialized"))).toBe(
      "The required TxLINE token account was missing. BlinkEdge now creates it automatically; choose Activate free data feed to retry."
    );
  });

  test("preserves an unclassified actionable error", () => {
    expect(formatWalletActivationError(new Error("Subscription is not available"))).toBe(
      "Subscription is not available"
    );
  });
});

test("shortenPublicKey keeps both identifying ends", () => {
  expect(shortenPublicKey("8whPXZZF6QyvzASvB7DGqQ5mtjmnSbpYggYv9oH7dWUv")).toBe("8whP…dWUv");
  expect(DEVNET_REQUIRED_MESSAGE).toContain("Testnet Mode to Devnet");
});
