import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
} from "@solana/web3.js";

const DEVNET_RPC = "https://api.devnet.solana.com";

// Devnet "hedge voucher" — a demo keypair that receives a small lamport transfer.
// In production this would be a real SPL mint. For the hackathon demo, we use a
// SystemProgram transfer to a fixed devnet address as the on-chain breadcrumb.
// Replace VOUCHER_RECIPIENT with a real devnet wallet you control.
const VOUCHER_RECIPIENT = new PublicKey(
  "11111111111111111111111111111112" // System program as placeholder recipient
);

export class SolanaTransactionService {
  private connection: Connection;

  constructor(rpcUrl: string = DEVNET_RPC) {
    this.connection = new Connection(rpcUrl, "confirmed");
  }

  async createHedgeTransaction(
    account: PublicKey,
    _marketId: string
  ): Promise<{ transaction: string; message: string }> {
    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash();

    const priorityFees = await this.connection.getRecentPrioritizationFees();
    const medianFee =
      priorityFees.length > 0
        ? priorityFees.sort(
            (a, b) => a.prioritizationFee - b.prioritizationFee
          )[Math.floor(priorityFees.length / 2)].prioritizationFee
        : 1000;
    const microLamports = Math.max(medianFee * 2, 1000);

    const transaction = new Transaction({
      feePayer: account,
      recentBlockhash: blockhash,
    }).add(
      // Priority fee — always set (prevents mempool drops)
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
      // Demo transfer — 1000 lamports to voucher recipient (on-chain breadcrumb)
      SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: VOUCHER_RECIPIENT,
        lamports: 1000,
      })
    );

    const serialized = transaction.serialize({
      requireAllSignatures: false,
    });

    const base64Tx = Buffer.from(serialized).toString("base64");

    return {
      transaction: base64Tx,
      message: "Confirm hedge on devnet. No real value at risk.",
    };
  }

  async simulateTransaction(transaction: Transaction): Promise<boolean> {
    try {
      const simulation = await this.connection.simulateTransaction(transaction);
      return simulation.value.err === null;
    } catch {
      return false;
    }
  }

  getConnection(): Connection {
    return this.connection;
  }
}

export const solanaService = new SolanaTransactionService();