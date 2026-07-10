import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  Keypair,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const DEVNET_RPC = "https://api.devnet.solana.com";
const HEDGE_AMOUNT = 100_000_000; // 0.1 tokens (9 decimals)

function loadVaultKeypair(): Keypair | null {
  const secretKey = process.env.SPL_VAULT_SECRET_KEY;
  if (!secretKey) return null;
  try {
    return Keypair.fromSecretKey(Buffer.from(secretKey, "base64"));
  } catch {
    return null;
  }
}

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
    });

    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
    );

    const vaultKeypair = loadVaultKeypair();
    const mintStr = process.env.SPL_HEDGE_MINT_ADDRESS;

    if (vaultKeypair && mintStr) {
      const mint = new PublicKey(mintStr);
      const userAta = await getAssociatedTokenAddress(mint, account);
      const vaultAta = await getAssociatedTokenAddress(mint, vaultKeypair.publicKey);

      const userAtaInfo = await this.connection.getAccountInfo(userAta);
      if (!userAtaInfo) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            account,
            userAta,
            account,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          ),
        );
      }

      transaction.add(
        createTransferCheckedInstruction(
          userAta,
          mint,
          vaultAta,
          account,
          HEDGE_AMOUNT,
          9,
          [],
          TOKEN_PROGRAM_ID,
        ),
      );
    } else {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: account,
          toPubkey: new PublicKey("11111111111111111111111111111112"),
          lamports: 1000,
        }),
      );
    }

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
