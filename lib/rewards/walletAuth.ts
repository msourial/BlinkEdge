import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

export function verifyWalletMessage(wallet: string, message: string, signatureBase64: string): boolean {
  try {
    const signature = Buffer.from(signatureBase64, "base64");
    return signature.length === nacl.sign.signatureLength && nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      signature,
      new PublicKey(wallet).toBytes(),
    );
  } catch {
    return false;
  }
}
