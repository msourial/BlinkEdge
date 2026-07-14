import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeNonce, recordProof, verifyGroupSession, type RewardTier } from "@/lib/rewards/rewardLedger";
import { verifyWalletMessage } from "@/lib/rewards/walletAuth";
import { verifyVenueQr } from "@/lib/rewards/venueQr";

const schema = z.object({
  wallet: z.string(), fixtureId: z.number().int().positive(), tier: z.enum(["solo", "group", "stadium"]),
  nonce: z.string().uuid(), message: z.string().max(600), signature: z.string().min(40),
  evidence: z.object({ arChallengeCompleted: z.literal(true), matchWindowVerified: z.literal(true), coarseGeofencePassed: z.boolean().optional(), sessionNonce: z.string().uuid(), confidence: z.number().min(0).max(1), venueQr: z.string().min(20).optional(), groupSessionCode: z.string().regex(/^[A-Za-z0-9]{10}$/).optional() }).strict(),
}).strict();

function validTier(tier: RewardTier, wallet: string, fixtureId: number, evidence: z.infer<typeof schema>["evidence"]) {
  if (tier === "stadium") return evidence.coarseGeofencePassed === true && Boolean(evidence.venueQr && verifyVenueQr(evidence.venueQr, wallet, fixtureId));
  if (tier === "group") return Boolean(evidence.groupSessionCode && verifyGroupSession(evidence.groupSessionCode, wallet, fixtureId));
  return true;
}

export async function POST(request: NextRequest) {
  const result = schema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: "Invalid claim. Camera media and precise location are never accepted." }, { status: 400 });
  const { wallet, fixtureId, nonce, message, signature, tier, evidence } = result.data;
  const issued = consumeNonce(nonce, wallet, fixtureId, "watch-proof");
  if (!issued || issued.message !== message) return NextResponse.json({ error: "This challenge expired or was already used." }, { status: 401 });
  if (!verifyWalletMessage(wallet, message, signature)) return NextResponse.json({ error: "Wallet signature could not be verified." }, { status: 401 });
  if (!validTier(tier, wallet, fixtureId, evidence)) return NextResponse.json({ error: `${tier} proof needs its required server-verifiable signals.` }, { status: 422 });
  const proof = recordProof({ wallet, fixtureId, tier, arVerified: true, matchWindowVerified: true, coarseGeofencePassed: evidence.coarseGeofencePassed, sessionNonce: evidence.sessionNonce, confidence: evidence.confidence, issuedAt: new Date().toISOString(), expiresAt: issued.expiresAt });
  return NextResponse.json({ proof, points: proof.points, note: "Points are non-redeemable in this release." });
}
