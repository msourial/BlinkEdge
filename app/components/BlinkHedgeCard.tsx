"use client";

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { WarningIcon, CheckIcon, XIcon, AlertCircleIcon, WalletIcon, SpinnerIcon } from "./ui/icons";

type HedgeState = "idle" | "loading-metadata" | "ready" | "sending" | "pending" | "confirmed" | "error";

export function BlinkHedgeCard({ marketId, onClose }: { marketId: string; onClose: () => void }) {
  const { connection } = useConnection();
  const { connected, publicKey, select, wallets, sendTransaction } = useWallet();
  const [state, setState] = useState<HedgeState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{ label: string; description: string } | null>(null);

  const clusterBadge = connected && publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
    : "not connected";

  const fetchMetadata = useCallback(async () => {
    setState("loading-metadata");
    setError(null);
    try {
      const res = await fetch(`/api/actions/hedge/${marketId}`);
      if (!res.ok) throw new Error(`GET failed: ${res.status}`);
      const data = await res.json();
      setMetadata({ label: data.label, description: data.description });
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setState("error");
    }
  }, [marketId]);

  const executeHedge = useCallback(async () => {
    if (!connected || !publicKey || !sendTransaction) {
      setError("Connect wallet first");
      setState("error");
      return;
    }

    setState("sending");
    setError(null);

    try {
      const res = await fetch(`/api/actions/hedge/${marketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: publicKey.toBase58() }),
      });

      if (!res.ok) throw new Error(`POST failed: ${res.status}`);
      const data = await res.json();

      if (!data.transaction) throw new Error("No transaction in response");

      const txBuffer = Buffer.from(data.transaction, "base64");
      const tx = Transaction.from(txBuffer);

      tx.feePayer = publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      setState("pending");

      const sig = await sendTransaction(tx, connection);
      console.log("Hedge tx signature:", sig);

      setState("confirmed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(msg);
      setState("error");
    }
  }, [connected, publicKey, sendTransaction, connection, marketId]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 40,
        backgroundColor: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div
        className="hud-card hud-card-amber relative max-w-sm w-full mx-4"
        style={{
          borderColor: state === "confirmed" ? "var(--color-acid)" : "var(--color-amber)",
          boxShadow:
            state === "confirmed"
              ? "0 0 12px, 0 0 24px, 0 0 48px, inset 0 0 12px var(--color-acid-glow-wide)"
              : "0 0 8px, 0 0 20px, 0 0 40px, inset 0 0 12px var(--color-amber-glow-wide)",
          backgroundColor: "rgba(10,10,15,0.9)",
          transition: "box-shadow 400ms ease-in-out",
        }}
      >
        {/* Devnet cluster badge */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider"
          style={{
            backgroundColor: "rgba(0,240,255,0.1)",
            border: "1px solid var(--color-primary)",
            color: "var(--color-primary)",
            boxShadow: "0 0 8px var(--color-primary-glow)",
          }}
        >
          {clusterBadge} · devnet
        </div>

        {state === "idle" && (
          <div className="px-6 py-6 text-center">
            <div
              className="mx-auto mb-4 flex items-center justify-center"
              style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "rgba(255,184,0,0.1)",
                border: "2px solid var(--color-amber)",
                boxShadow: "0 0 20px var(--color-amber-glow-wide)",
              }}
            >
              <WarningIcon size={28} className="text-amber" />
            </div>
            <div
              className="text-xl font-bold mb-2 text-halo"
              style={{ color: "var(--color-amber)" }}
            >
              Hedge Available
            </div>
            <p className="text-sm text-ink-body mb-1 text-halo">
              Risk detected on this market.
            </p>
            <p className="text-xs text-ink-faint mb-6 text-halo">
              Devnet only — no real funds at risk.
            </p>
            {!connected && (
              <div className="mb-5 p-3 rounded-lg" style={{ background: "rgba(0,240,255,0.06)", border: "1px solid var(--color-chrome-border)" }}>
                <p className="text-xs text-ink-muted mb-2 text-halo">Connect a wallet to hedge.</p>
                {wallets.length > 0 && (
                  <button
                    onClick={() => select(wallets[0].adapter.name)}
                    className="text-xs font-semibold px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 mx-auto"
                    style={{
                      color: "var(--color-primary)",
                      border: "1px solid var(--color-primary)",
                      background: "transparent",
                      minHeight: "36px",
                      boxShadow: "0 0 8px var(--color-primary-glow-wide)",
                    }}
                  >
                    <WalletIcon size={14} className="text-primary" />
                    Connect Wallet
                  </button>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 hover:bg-white/5"
                style={{
                  borderColor: "var(--color-chrome-border-strong)",
                  color: "var(--color-ink-muted)",
                  minHeight: "44px",
                }}
              >
                Dismiss
              </button>
              <button
                onClick={fetchMetadata}
                disabled={!connected}
                className="btn-neon btn-neon-amber"
                style={{
                  minHeight: "44px",
                  opacity: connected ? 1 : 0.4,
                  cursor: connected ? "pointer" : "not-allowed",
                }}
              >
                Hedge Now
              </button>
            </div>
          </div>
        )}

        {state === "loading-metadata" && (
          <div className="px-6 py-8 text-center">
            <SpinnerIcon size={24} className="mx-auto mb-4 text-amber" />
            <p className="text-xs text-ink-faint text-halo">
              Loading Action metadata…
            </p>
          </div>
        )}

        {state === "ready" && metadata && (
          <div className="px-6 py-6 text-center">
            <div
              className="font-bold mb-2 text-halo"
              style={{ color: "var(--color-amber)", fontSize: "16px" }}
            >
              {metadata.label}
            </div>
            <p className="text-xs text-ink-muted mb-3 text-halo">
              {metadata.description}
            </p>
            {!connected && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: "rgba(255,0,229,0.06)", border: "1px solid var(--color-chrome-border)" }}>
                <p className="text-xs mb-2 text-halo" style={{ color: "var(--color-magenta)" }}>
                  Connect wallet to continue
                </p>
                {wallets.length > 0 && (
                  <button
                    onClick={() => select(wallets[0].adapter.name)}
                    className="text-xs font-semibold px-4 py-2 rounded-md transition-all duration-200 inline-flex items-center gap-2"
                    style={{
                      color: "var(--color-primary)",
                      border: "1px solid var(--color-primary)",
                      background: "transparent",
                      minHeight: "36px",
                    }}
                  >
                    <WalletIcon size={14} className="text-primary" />
                    Connect Wallet
                  </button>
                )}
              </div>
            )}
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 hover:bg-white/5"
                style={{
                  borderColor: "var(--color-chrome-border-strong)",
                  color: "var(--color-ink-muted)",
                  minHeight: "44px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeHedge}
                disabled={!connected}
                className="btn-neon btn-neon-amber"
                style={{
                  minHeight: "44px",
                  opacity: connected ? 1 : 0.4,
                  cursor: connected ? "pointer" : "not-allowed",
                }}
              >
                Confirm in Wallet
              </button>
            </div>
          </div>
        )}

        {state === "pending" && (
          <div className="px-6 py-8 text-center">
            <SpinnerIcon size={24} className="mx-auto mb-4 text-amber" />
            <p
              className="text-sm font-mono text-halo"
              style={{ color: "var(--color-amber)" }}
            >
              Waiting for wallet signature…
            </p>
          </div>
        )}

        {state === "confirmed" && (
          <div className="px-6 py-6 text-center">
            <div
              className="mx-auto mb-4 flex items-center justify-center"
              style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "rgba(57,255,20,0.1)",
                border: "2px solid var(--color-acid)",
                boxShadow: "0 0 20px var(--color-acid-glow-wide)",
              }}
            >
              <CheckIcon size={28} className="text-acid" />
            </div>
            <div
              className="text-xl font-bold mb-2 text-halo"
              style={{ color: "var(--color-acid)" }}
            >
              Hedged
            </div>
            <p className="text-sm text-ink-body mb-1 text-halo">
              Position hedged on devnet.
            </p>
            <p className="text-xs text-ink-faint mb-6 text-halo">
              Signature recorded on devnet cluster.
            </p>
            <button
              onClick={onClose}
              className="btn-neon"
              style={{
                borderColor: "var(--color-acid)",
                color: "var(--color-acid)",
                boxShadow: "0 0 8px, 0 0 20px var(--color-acid-glow)",
                minHeight: "44px",
              }}
            >
              Done
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="px-6 py-6 text-center">
            <div
              className="mx-auto mb-4 flex items-center justify-center"
              style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "rgba(255,0,229,0.1)",
                border: "2px solid var(--color-magenta)",
              }}
            >
              <XIcon size={28} className="text-magenta" />
            </div>
            <div
              className="text-lg font-bold mb-2 text-halo"
              style={{ color: "var(--color-magenta)" }}
            >
              Failed
            </div>
            <p className="text-xs text-ink-muted mb-5 text-halo break-words">
              {error}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setState("ready")}
                className="btn-neon"
                style={{
                  borderColor: "var(--color-magenta)",
                  color: "var(--color-magenta)",
                  minHeight: "44px",
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}