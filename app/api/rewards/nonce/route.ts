import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { issueNonce } from "@/lib/rewards/rewardLedger";

const schema = z.object({ wallet: z.string(), fixtureId: z.number().int().positive(), purpose: z.enum(["watch-proof", "group-qr"]) }).strict();

export async function POST(request: NextRequest) {
  const result = schema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: "Invalid nonce request." }, { status: 400 });
  try { new PublicKey(result.data.wallet); } catch { return NextResponse.json({ error: "Invalid wallet." }, { status: 400 }); }
  const nonce = issueNonce(result.data.wallet, result.data.fixtureId, result.data.purpose);
  return NextResponse.json({ nonce: nonce.nonce, message: nonce.message, expiresAt: nonce.expiresAt });
}
