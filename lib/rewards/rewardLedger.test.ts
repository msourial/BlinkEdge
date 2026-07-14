import { describe, expect, it } from "vitest";
import { consumeNonce, issueNonce, POINTS_BY_TIER, recordProof, walletRewards } from "./rewardLedger";

const wallet = `test-wallet-${Date.now()}`;

describe("reward ledger", () => {
  it("issues one-time, wallet-bound signing challenges", () => {
    const challenge = issueNonce(wallet, 55, "watch-proof");
    expect(consumeNonce(challenge.nonce, wallet, 55, "watch-proof")).toMatchObject({ nonce: challenge.nonce });
    expect(consumeNonce(challenge.nonce, wallet, 55, "watch-proof")).toBeNull();
  });

  it("keeps only the highest tier for one wallet and fixture", () => {
    const base = { wallet, fixtureId: 56, arVerified: true, matchWindowVerified: true, sessionNonce: "test-session", confidence: 0.9, issuedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() };
    recordProof({ ...base, tier: "solo" });
    const upgraded = recordProof({ ...base, tier: "stadium", coarseGeofencePassed: true });
    const lowerRetry = recordProof({ ...base, tier: "group" });
    expect(upgraded.points).toBe(POINTS_BY_TIER.stadium);
    expect(lowerRetry.points).toBe(POINTS_BY_TIER.stadium);
    expect(walletRewards(wallet).points).toBe(POINTS_BY_TIER.stadium);
  });
});
