import { randomUUID } from "node:crypto";

export type RewardTier = "solo" | "group" | "stadium";
export const POINTS_BY_TIER: Record<RewardTier, number> = { solo: 30, group: 60, stadium: 100 };

export interface WatchProof {
  id: string;
  wallet: string;
  fixtureId: number;
  tier: RewardTier;
  points: number;
  arVerified: boolean;
  matchWindowVerified: boolean;
  coarseGeofencePassed?: boolean;
  sessionNonce: string;
  confidence: number;
  issuedAt: string;
  expiresAt: string;
  claimedAt: string;
}

export interface AuthNonce {
  nonce: string;
  wallet: string;
  fixtureId: number;
  purpose: string;
  message: string;
  expiresAt: string;
  used: boolean;
}

interface RewardState { nonces: Map<string, AuthNonce>; proofs: Map<string, WatchProof>; }

declare global { var blinkEdgeRewardState: RewardState | undefined; }

function state(): RewardState {
  globalThis.blinkEdgeRewardState ??= { nonces: new Map(), proofs: new Map() };
  return globalThis.blinkEdgeRewardState;
}

export function issueNonce(wallet: string, fixtureId: number, purpose: string): AuthNonce {
  const nonce = randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
  const message = `BlinkEdge ${purpose}\nWallet: ${wallet}\nFixture: ${fixtureId}\nNonce: ${nonce}\nExpires: ${expiresAt}`;
  const value = { nonce, wallet, fixtureId, purpose, message, expiresAt, used: false };
  state().nonces.set(nonce, value);
  return value;
}

export function consumeNonce(nonce: string, wallet: string, fixtureId: number, purpose: string): AuthNonce | null {
  const found = state().nonces.get(nonce);
  if (!found || found.used || found.wallet !== wallet || found.fixtureId !== fixtureId || found.purpose !== purpose || Date.parse(found.expiresAt) < Date.now()) return null;
  found.used = true;
  return found;
}

export function recordProof(input: Omit<WatchProof, "id" | "points" | "claimedAt">): WatchProof {
  const key = `${input.wallet}:${input.fixtureId}`;
  const current = state().proofs.get(key);
  if (current && current.points >= POINTS_BY_TIER[input.tier]) return current;
  const proof: WatchProof = { ...input, id: randomUUID(), points: POINTS_BY_TIER[input.tier], claimedAt: new Date().toISOString() };
  state().proofs.set(key, proof);
  return proof;
}

export function walletRewards(wallet: string) {
  const proofs = [...state().proofs.values()].filter((proof) => proof.wallet === wallet);
  return { points: proofs.reduce((total, proof) => total + proof.points, 0), proofs };
}

export interface GroupWatchSession {
  id: string;
  code: string;
  fixtureId: number;
  hostWallet: string;
  expiresAt: string;
  wallets: string[];
}

const groupSessions = new Map<string, GroupWatchSession>();

export function issueGroupSession(hostWallet: string, fixtureId: number): GroupWatchSession {
  const code = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
  const session = { id: randomUUID(), code, fixtureId, hostWallet, expiresAt: new Date(Date.now() + 2 * 60_000).toISOString(), wallets: [hostWallet] };
  groupSessions.set(code, session);
  return session;
}

export function joinGroupSession(code: string, wallet: string): GroupWatchSession | null {
  const session = groupSessions.get(code.toUpperCase());
  if (!session || Date.parse(session.expiresAt) < Date.now() || session.wallets.includes(wallet) || session.wallets.length >= 8) return null;
  session.wallets.push(wallet);
  return session;
}

export function verifyGroupSession(code: string, wallet: string, fixtureId: number): boolean {
  const session = groupSessions.get(code.toUpperCase());
  return Boolean(session && session.fixtureId === fixtureId && Date.parse(session.expiresAt) >= Date.now() && session.wallets.includes(wallet));
}
