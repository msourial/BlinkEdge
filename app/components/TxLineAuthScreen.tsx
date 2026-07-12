"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { subscribeToTxLineFreeTier } from "@/lib/solana/TxLineSubscriptionService";
import { getGuestJwt, buildActivationMessage, activateApiToken } from "@/lib/txline/txLineAuth";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { FIXTURE_IDS } from "@/lib/txline/txLineFixtureIds";

interface TxLineAuthScreenProps {
  onSuccess: (jwt: string, apiToken: string) => void;
  onError: (error: string) => void;
}

export function TxLineAuthScreen({ onSuccess, onError }: TxLineAuthScreenProps) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const handleSubscribe = async () => {
    if (!wallet.publicKey || !wallet.signMessage) {
      onError("Please connect a wallet that supports message signing.");
      return;
    }

    setLoading(true);
    try {
      setStatusText("Executing subscription transaction...");
      const txSig = await subscribeToTxLineFreeTier(wallet, connection);

      setStatusText("Fetching Guest JWT...");
      const jwt = await getGuestJwt();

      setStatusText("Awaiting wallet signature...");
      // For free tier, passing empty leagues array as default or we can map all FIXTURE_IDS
      // Wait, let's map the league IDs if they are available.
      const message = buildActivationMessage(txSig, jwt, []); 
      const signatureBytes = await wallet.signMessage(message);
      const signatureBase64 = Buffer.from(signatureBytes).toString("base64");

      setStatusText("Activating API Token...");
      const apiToken = await activateApiToken(jwt, txSig, signatureBase64, []);

      onSuccess(jwt, apiToken);
    } catch (error: any) {
      console.error("Subscription failed:", error);
      onError(error.message || "Failed to subscribe and activate API.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <h1 className="text-2xl font-black text-cyan-400 mb-6 uppercase tracking-wider">
        TxLINE Connection
      </h1>
      <p className="text-slate-300 mb-8 text-sm">
        To receive real-time data, you must subscribe to the TxLINE Free Tier on Devnet.
      </p>

      <div className="mb-8">
        <WalletMultiButton />
      </div>

      {wallet.connected && (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 bg-cyan-500/20 hover:bg-cyan-500/30 border-2 border-cyan-400 text-cyan-50 font-bold uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50"
        >
          {loading ? "Processing..." : "Subscribe to Free Tier"}
        </button>
      )}

      {loading && (
        <p className="mt-4 text-cyan-300 animate-pulse text-sm font-mono">
          {statusText}
        </p>
      )}
    </div>
  );
}
