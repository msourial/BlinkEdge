import { DEVNET_ORIGIN, AUTH_PATH, ACTIVATE_PATH } from "./txLineFixtureIds";

export function extractApiToken(responseBody: string): string {
  const trimmedBody = responseBody.trim();
  if (!trimmedBody) {
    throw new Error("TxLINE activation returned an empty API token.");
  }

  try {
    const parsedBody: unknown = JSON.parse(trimmedBody);

    if (typeof parsedBody === "string" && parsedBody) {
      return parsedBody;
    }

    if (
      typeof parsedBody === "object" &&
      parsedBody !== null &&
      "token" in parsedBody &&
      typeof parsedBody.token === "string" &&
      parsedBody.token
    ) {
      return parsedBody.token;
    }
  } catch {
    // TxLINE can return the activated API token as plain text.
    return trimmedBody;
  }

  throw new Error("TxLINE activation returned an invalid API token response.");
}

export async function getGuestJwt(): Promise<string> {
  const response = await fetch(`${DEVNET_ORIGIN}${AUTH_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Guest JWT request failed: ${response.status}`);
  }
  const responseBody = await response.text();
  const data = JSON.parse(responseBody) as { token?: unknown };
  if (typeof data.token !== "string" || !data.token) {
    throw new Error("Guest JWT response did not include a token.");
  }
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
  return extractApiToken(await response.text());
}

export function buildActivationMessage(
  txSig: string,
  jwt: string,
  leagues: number[] = [],
): Uint8Array {
  const messageString = `${txSig}:${leagues.join(",")}:${jwt}`;
  return new TextEncoder().encode(messageString);
}
