import * as anchor from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";

export const TXLINE_CONFIG = {
  devnet: {
    rpcUrl: "https://api.devnet.solana.com",
    apiOrigin: "https://txline-dev.txodds.com",
    programId: new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J"),
    txlTokenMint: new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG"),
  },
};

const SERVICE_LEVEL_ID = 1;
const DURATION_WEEKS = 4;

// The checked-in legacy IDL predates the current devnet program. In particular,
// it omits the program address and has the final two subscribe accounts in the
// wrong order. Keep this small, current instruction definition next to the
// transaction that uses it so browser wallets construct the exact devnet call.
const TXLINE_DEVNET_SUBSCRIBE_IDL = {
  address: "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J",
  metadata: {
    name: "txoracle",
    version: "1.5.6",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "subscribe",
      discriminator: [254, 28, 191, 138, 156, 179, 183, 53],
      accounts: [
        { name: "user", writable: true, signer: true },
        { name: "pricing_matrix" },
        { name: "token_mint" },
        { name: "user_token_account", writable: true },
        { name: "token_treasury_vault", writable: true },
        { name: "token_treasury_pda" },
        { name: "token_program" },
        { name: "system_program" },
        { name: "associated_token_program" },
      ],
      args: [
        { name: "service_level_id", type: "u16" },
        { name: "weeks", type: "u8" },
      ],
    },
  ],
} as unknown as anchor.Idl;

export async function subscribeToTxLineFreeTier(
  wallet: WalletContextState,
  connection: Connection
): Promise<TransactionSignature> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error("Wallet not connected");
  }

  const config = TXLINE_CONFIG.devnet;
  const programId = config.programId;
  const txlTokenMint = config.txlTokenMint;

  const provider = new anchor.AnchorProvider(
    connection,
    wallet as unknown as anchor.Wallet,
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = new anchor.Program(
    TXLINE_DEVNET_SUBSCRIBE_IDL,
    provider
  );

  if (!program.programId.equals(programId)) {
    throw new Error("TxLINE devnet program configuration is invalid");
  }

  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_treasury_v2")],
    programId
  );

  const tokenTreasuryVault = getAssociatedTokenAddressSync(
    txlTokenMint,
    tokenTreasuryPda,
    true,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const [pricingMatrixPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pricing_matrix")],
    programId
  );

  const userTokenAccount = getAssociatedTokenAddressSync(
    txlTokenMint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const subscribeInstruction = await program.methods
    .subscribe(SERVICE_LEVEL_ID, DURATION_WEEKS)
    .accounts({
      user: wallet.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint: txlTokenMint,
      userTokenAccount,
      tokenTreasuryVault,
      tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  // TxLINE expects the caller's TxL Token-2022 associated account to exist.
  // A brand-new Devnet wallet will not have one, so create it in the same
  // transaction. The idempotent instruction is also safe for returning users.
  const transaction = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey,
      userTokenAccount,
      wallet.publicKey,
      txlTokenMint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ),
    subscribeInstruction
  );

  const txSig = await provider.sendAndConfirm(transaction);

  return txSig;
}
