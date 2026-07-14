export const DEVNET_REQUIRED_MESSAGE =
  "No Devnet SOL was found for this address. In Phantom, switch Testnet Mode to Devnet, then refresh BlinkEdge. If it is already on Devnet, add Devnet SOL and try again.";

export function isWalletApprovalRejected(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    message.includes("user rejected") ||
    message.includes("user declined") ||
    message.includes("rejected the request") ||
    message.includes("cancelled") ||
    message.includes("canceled")
  );
}

export function formatWalletActivationError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const normalizedMessage = message.toLowerCase();

  if (isWalletApprovalRejected(error)) {
    return "Wallet approval was cancelled. Choose Activate free data feed to try again.";
  }

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network request failed") ||
    normalizedMessage.includes("rpc") ||
    normalizedMessage.includes("429")
  ) {
    return "Could not reach Solana Devnet. Check your connection, then try again.";
  }

  if (
    normalizedMessage.includes("anchorerror") ||
    normalizedMessage.includes("transaction simulation failed") ||
    normalizedMessage.includes("custom program error")
  ) {
    if (normalizedMessage.includes("accountnotinitialized") || normalizedMessage.includes("user_token_account")) {
      return "The required TxLINE token account was missing. BlinkEdge now creates it automatically; choose Activate free data feed to retry.";
    }

    return "TxLINE could not complete the Devnet subscription transaction. Confirm your wallet is on Devnet and try again.";
  }

  return message || "Could not activate the free data feed. Please try again.";
}

export function shortenPublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}…${publicKey.slice(-4)}`;
}
