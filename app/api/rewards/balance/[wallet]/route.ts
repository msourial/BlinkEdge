import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { walletRewards } from "@/lib/rewards/rewardLedger";

export async function GET(_: NextRequest, context: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await context.params;
  try { new PublicKey(wallet); } catch { return NextResponse.json({ error: "Invalid wallet." }, { status: 400 }); }
  return NextResponse.json(walletRewards(wallet));
}
