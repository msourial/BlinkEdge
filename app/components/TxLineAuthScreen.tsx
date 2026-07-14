"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { subscribeToTxLineFreeTier } from "@/lib/solana/TxLineSubscriptionService";
import { DEVNET_REQUIRED_MESSAGE, formatWalletActivationError, shortenPublicKey } from "@/lib/solana/walletActivation";
import { getGuestJwt, buildActivationMessage, activateApiToken } from "@/lib/txline/txLineAuth";

interface TxLineAuthScreenProps {
  onSuccess: (jwt: string, apiToken: string) => void;
}

const SUPPORTED_WALLET_NAMES = new Set(["Phantom", "Solflare"]);

export function TxLineAuthScreen({ onSuccess }: TxLineAuthScreenProps) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [selectedWalletName, setSelectedWalletName] = useState<WalletName | null>(null);
  const [subscriptionTxSig, setSubscriptionTxSig] = useState<string | null>(null);
  const availableWallets = wallet.wallets.filter(({ adapter }) => SUPPORTED_WALLET_NAMES.has(adapter.name));
  const { connected, connecting, disconnect, select, connect, publicKey, signMessage } = wallet;
  const selectedAdapterName = wallet.wallet?.adapter.name;
  const connectedWalletLabel = selectedAdapterName ?? "Solana wallet";

  // Wallet adapters can remain in `connecting` when no browser extension is
  // installed (or when the extension never answers). Never leave the primary
  // action stuck indefinitely; return the screen to an actionable state.
  useEffect(() => {
    if (!connecting) return;

    const timeout = window.setTimeout(() => {
      void disconnect().catch(() => undefined);
      setLocalError("Wallet connection timed out. Install Phantom/Solflare or use demo mode.");
    }, 8_000);

    return () => window.clearTimeout(timeout);
  }, [connecting, disconnect]);

  useEffect(() => {
    if (
      !selectedWalletName ||
      connected ||
      connecting ||
      selectedAdapterName !== selectedWalletName
    ) {
      return;
    }

    void connect().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Could not connect the selected wallet.";
      setLocalError(message);
      setSelectedWalletName(null);
    });
  }, [connect, connected, connecting, selectedAdapterName, selectedWalletName]);

  const handleWalletChoice = (walletName: WalletName) => {
    setLocalError(null);
    setSelectedWalletName(walletName);
    select(walletName);
  };

  const handleDemoMode = () => {
    setLocalError(null);
    onSuccess("demo-jwt", "demo-api-token");
  };

  const handleSubscribe = async () => {
    if (!publicKey || !signMessage) {
      setLocalError("Connect Phantom or Solflare on Devnet to continue.");
      return;
    }

    setLoading(true);
    setLocalError(null);
    try {
      setStatusText("Checking Devnet wallet balance...");
      const balance = await connection.getBalance(publicKey, "confirmed");
      if (balance === 0) {
        setLocalError(DEVNET_REQUIRED_MESSAGE);
        return;
      }

      let txSig = subscriptionTxSig;
      if (!txSig) {
        setStatusText("Executing subscription transaction...");
        txSig = await subscribeToTxLineFreeTier(wallet, connection);
        setSubscriptionTxSig(txSig);
      } else {
        setStatusText("Retrying API activation...");
      }

      setStatusText("Fetching Guest JWT...");
      const jwt = await getGuestJwt();

      setStatusText("Awaiting wallet signature...");
      const message = buildActivationMessage(txSig, jwt, []);
      const signatureBytes = await signMessage(message);
      const signatureBase64 = bytesToBase64(signatureBytes);

      setStatusText("Activating API Token...");
      const apiToken = await activateApiToken(jwt, txSig, signatureBase64, []);

      setSubscriptionTxSig(null);
      onSuccess(jwt, apiToken);
    } catch (error: unknown) {
      const message = formatWalletActivationError(error);
      setLocalError(message);
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-[#090a10] px-5 pb-7 pt-6 text-left sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[46%] bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,240,255,0.24),transparent_66%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />

      <header className="relative flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-300/70 bg-cyan-400/10 font-mono text-xs font-semibold tracking-tight text-cyan-100 shadow-[0_0_16px_rgba(0,240,255,0.25)]">BE</div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">BlinkEdge</span>
        </div>
        <span className="rounded-md border border-cyan-400/30 bg-cyan-400/8 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan-200">Devnet</span>
      </header>

      <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
        <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.9)]" />
          Live data access
        </div>
        <h1 className="max-w-[300px] text-[34px] font-bold leading-[0.98] tracking-[-0.055em] text-white sm:text-[38px]">
          See the match.<br /><span className="text-cyan-300">Stay ahead.</span>
        </h1>
        <p className="mt-4 max-w-[330px] text-sm leading-6 text-slate-400">
          Connect once to unlock TxLINE&apos;s free World Cup feed in your BlinkEdge HUD.
        </p>

        <div className="mt-8 border-y border-white/8 py-1">
          {[
            ["01", "Connect wallet", "Your Solana Devnet wallet"],
            ["02", "Activate free feed", "No TxL purchase required"],
            ["03", "Launch the HUD", "Live odds and risk signals"],
          ].map(([number, title, description]) => (
            <div key={number} className="flex items-center gap-4 border-b border-white/8 py-4 last:border-b-0">
              <span className="font-mono text-xs text-cyan-300">{number}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              </div>
              <span className="ml-auto text-cyan-300/70" aria-hidden="true">↗</span>
            </div>
          ))}
        </div>

        {!connected && (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setShowWalletOptions((isOpen) => !isOpen)}
              disabled={connecting}
              className="flex min-h-12 w-full items-center justify-center rounded-lg border border-violet-300/70 bg-violet-300 px-5 text-sm font-bold text-[#160d2b] shadow-[0_0_24px_rgba(167,139,250,0.28)] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connecting ? "Connecting wallet…" : "Connect wallet"}
            </button>

            {showWalletOptions && (
              <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-black/25 p-3">
                <p className="px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Available wallets</p>
                {availableWallets.map(({ adapter, readyState }) => (
                  <button
                    key={adapter.name}
                    type="button"
                    onClick={() => handleWalletChoice(adapter.name)}
                    disabled={connecting || readyState === WalletReadyState.Unsupported}
                    className="flex min-h-12 w-full items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 text-left text-sm font-semibold text-slate-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {adapter.icon && <img src={adapter.icon} alt="" className="h-6 w-6 rounded-md" />}
                    <span>{adapter.name}</span>
                    <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-cyan-200">
                      {readyState === WalletReadyState.Installed
                        ? "Installed"
                        : readyState === WalletReadyState.Unsupported
                          ? "Unavailable"
                          : readyState === WalletReadyState.Loadable
                            ? "Available"
                            : "Open extension"}
                    </span>
                  </button>
                ))}
                {availableWallets.length === 0 && (
                  <p className="px-1 py-2 text-xs leading-5 text-slate-400">Phantom or Solflare is not configured. Refresh after installing an extension.</p>
                )}
              </div>
            )}
          </div>
        )}

        {connected && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-cyan-400/25 bg-cyan-400/5 px-3 py-2 text-xs">
              <span className="font-semibold text-slate-200">{connectedWalletLabel} · {shortenPublicKey(publicKey?.toBase58() ?? "")}</span>
              <span className="font-mono uppercase tracking-wide text-cyan-200">Devnet required</span>
            </div>
            <button onClick={handleSubscribe} disabled={loading} className="flex min-h-12 w-full items-center justify-center rounded-lg border border-cyan-300 bg-cyan-300 px-5 text-sm font-bold text-[#061014] shadow-[0_0_24px_rgba(0,240,255,0.32)] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Activating your feed…" : subscriptionTxSig ? "Retry API activation" : "Activate free data feed"}
            </button>
          </div>
        )}

        {!connected && !connecting && !showWalletOptions && (
          <button
            type="button"
            onClick={handleDemoMode}
            className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-200"
          >
            Continue in demo mode
          </button>
        )}

        {(loading || localError) && (
          <p role={localError ? "alert" : "status"} className={`mt-4 rounded-lg border px-3 py-2 text-xs ${localError ? "border-magenta/50 bg-magenta/10 text-pink-200" : "border-cyan-400/20 bg-cyan-400/5 font-mono text-cyan-200"}`}>
            {localError ?? statusText}
          </p>
        )}
        <p className="mt-4 text-center text-[11px] leading-4 text-slate-600">Free tier · No card · You approve every wallet signature</p>
      </main>

      <footer className="relative flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">
        <span>Powered by</span><span className="text-slate-400">TxLINE</span>
      </footer>
    </div>
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
