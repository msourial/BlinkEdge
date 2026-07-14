import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeNonce, issueGroupSession, joinGroupSession } from "@/lib/rewards/rewardLedger";
import { verifyWalletMessage } from "@/lib/rewards/walletAuth";

const signed = z.object({ wallet: z.string(), fixtureId: z.number().int().positive(), nonce: z.string().uuid(), message: z.string().max(600), signature: z.string().min(40) });
const schema = z.discriminatedUnion("action", [
  signed.extend({ action: z.literal("issue") }).strict(),
  signed.extend({ action: z.literal("join"), code: z.string().regex(/^[A-Za-z0-9]{10}$/), arChallengeCompleted: z.literal(true), deviceSessionNonce: z.string().uuid() }).strict(),
]);

export async function POST(request: NextRequest) {
  const result = schema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ error: "Invalid group proof request." }, { status: 400 });
  const payload = result.data;
  const issued = consumeNonce(payload.nonce, payload.wallet, payload.fixtureId, "group-qr");
  if (!issued || issued.message !== payload.message || !verifyWalletMessage(payload.wallet, payload.message, payload.signature)) return NextResponse.json({ error: "Group QR signature challenge expired or was invalid." }, { status: 401 });
  if (payload.action === "issue") {
    const session = issueGroupSession(payload.wallet, payload.fixtureId);
    return NextResponse.json({ code: session.code, expiresAt: session.expiresAt, maxGuests: 7, privacy: "The QR encodes only an opaque, two-minute session code." });
  }
  const session = joinGroupSession(payload.code, payload.wallet);
  if (!session || session.fixtureId !== payload.fixtureId) return NextResponse.json({ error: "This group QR is expired, full, duplicated, or for another match." }, { status: 422 });
  return NextResponse.json({ groupQrVerified: true, expiresAt: session.expiresAt, participants: session.wallets.length });
}
