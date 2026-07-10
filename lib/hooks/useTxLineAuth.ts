"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getGuestJwt, activateApiToken, buildActivationMessage } from "@/lib/txline/txLineAuth";

export type AuthStatus = "loading" | "ready" | "activating" | "active" | "expired" | "error";

interface UseTxLineAuthReturn {
  jwt: string | null;
  apiToken: string | null;
  status: AuthStatus;
  error: string | null;
  activate: (txSig: string) => Promise<void>;
  reset: () => void;
}

export function useTxLineAuth(): UseTxLineAuthReturn {
  const wallet = useWallet();
  const [jwt, setJwt] = useState<string | null>(null);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchJwt() {
      try {
        const token = await getGuestJwt();
        if (!cancelled) {
          setJwt(token);
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to get guest JWT");
          setStatus("error");
        }
      }
    }

    fetchJwt();

    return () => {
      cancelled = true;
    };
  }, []);

  const activate = useCallback(async (txSig: string) => {
    if (!jwt) {
      setError("No guest JWT available");
      setStatus("error");
      return;
    }

    if (!wallet.signMessage) {
      setError("Wallet does not support signMessage");
      setStatus("error");
      return;
    }

    setStatus("activating");
    setError(null);

    try {
      const message = buildActivationMessage(txSig, jwt, []);
      const signMsg = wallet.signMessage as (msg: Uint8Array) => Promise<Uint8Array>;
      const signatureBytes = await signMsg(message);
      const walletSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

      const token = await activateApiToken(jwt, txSig, walletSignature, []);
      setApiToken(token);
      setStatus("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed");
      setStatus("error");
    }
  }, [jwt, wallet]);

  const reset = useCallback(() => {
    setApiToken(null);
    setStatus(jwt ? "ready" : "loading");
    setError(null);
  }, [jwt]);

  return { jwt, apiToken, status, error, activate, reset };
}
