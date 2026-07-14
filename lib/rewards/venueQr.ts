import { createHmac, timingSafeEqual } from "node:crypto";

interface VenueQrPayload { fixtureId: number; wallet: string; expiresAt: string; }

/**
 * Partner QR format: base64url(JSON { fixtureId, wallet, expiresAt }).base64url(HMAC-SHA256(payload)).
 * The signing secret only exists on the partner verifier and this server.
 */
export function verifyVenueQr(token: string, wallet: string, fixtureId: number): boolean {
  const secret = process.env.VENUE_QR_HMAC_SECRET;
  const [encodedPayload, encodedSignature, ...extra] = token.split(".");
  if (!secret || !encodedPayload || !encodedSignature || extra.length) return false;
  try {
    const expected = createHmac("sha256", secret).update(encodedPayload).digest();
    const received = Buffer.from(encodedSignature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as VenueQrPayload;
    return payload.wallet === wallet && payload.fixtureId === fixtureId && Date.parse(payload.expiresAt) >= Date.now();
  } catch {
    return false;
  }
}
