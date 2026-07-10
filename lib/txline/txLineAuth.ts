import { DEVNET_ORIGIN, AUTH_PATH, ACTIVATE_PATH } from "./txLineFixtureIds";

export async function getGuestJwt(): Promise<string> {
  const response = await fetch(`${DEVNET_ORIGIN}${AUTH_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Guest JWT request failed: ${response.status}`);
  }
  const data = await response.json();
  return data.token;
}

export async function activateApiToken(
  jwt: string,
  txSig: string,
  walletSignature: string,
  leagues: number[] = [],
): Promise<string> {
  const response = await fetch(`${DEVNET_ORIGIN}${ACTIVATE_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ txSig, walletSignature, leagues }),
  });
  if (!response.ok) {
    throw new Error(`API token activation failed: ${response.status}`);
  }
  const data = await response.json();
  return data.token;
}

export function buildActivationMessage(
  txSig: string,
  jwt: string,
  leagues: number[] = [],
): Uint8Array {
  const messageString = `${txSig}:${leagues.join(",")}:${jwt}`;
  return new TextEncoder().encode(messageString);
}
