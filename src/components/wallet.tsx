import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { connectWallet, currentWalletProvider } from "@/lib/lastcommit-client";

export type WalletStatus = "unavailable" | "disconnected" | "connecting" | "connected" | "wrong-network" | "error";

type WalletContextValue = {
  address: string;
  status: WalletStatus;
  error: string;
  connect: () => Promise<string | null>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function isAddress(value: unknown): value is string {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isStudionet(chainId: unknown): boolean {
  return String(chainId).toLowerCase() === "0xf22f";
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [error, setError] = useState("");

  const sync = useCallback(async () => {
    const wallet = currentWalletProvider();
    if (!wallet) {
      setStatus("unavailable");
      setAddress("");
      return;
    }
    try {
      const [accounts, chainId] = await Promise.all([
        wallet.request({ method: "eth_accounts" }),
        wallet.request({ method: "eth_chainId" }),
      ]);
      const nextAddress = Array.isArray(accounts) && isAddress(accounts[0]) ? accounts[0] : "";
      setAddress(nextAddress);
      setStatus(nextAddress ? (isStudionet(chainId) ? "connected" : "wrong-network") : "disconnected");
      setError("");
    } catch {
      setStatus("error");
      setError("The wallet could not be read.");
    }
  }, []);

  useEffect(() => {
    const wallet = currentWalletProvider();
    void sync();
    if (!wallet?.on) return;
    const accountsChanged = (accounts: unknown) => {
      const nextAddress = Array.isArray(accounts) && isAddress(accounts[0]) ? accounts[0] : "";
      setAddress(nextAddress);
      setStatus(nextAddress ? "connected" : "disconnected");
    };
    const chainChanged = () => void sync();
    wallet.on("accountsChanged", accountsChanged);
    wallet.on("chainChanged", chainChanged);
    return () => {
      wallet.removeListener?.("accountsChanged", accountsChanged);
      wallet.removeListener?.("chainChanged", chainChanged);
    };
  }, [sync]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError("");
    try {
      const nextAddress = await connectWallet();
      setAddress(nextAddress);
      setStatus("connected");
      return nextAddress;
    } catch (value) {
      const message = value instanceof Error ? value.message : "Wallet connection failed.";
      setError(message);
      setStatus(message.includes("Studionet") ? "wrong-network" : "error");
      return null;
    }
  }, []);

  const value = useMemo(() => ({ address, status, error, connect }), [address, connect, error, status]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider");
  return context;
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, status, error, connect } = useWallet();
  if (status === "connected" && address) {
    return (
      <span className="border border-line px-3 py-2 font-mono text-[11px] text-muted" title={address} aria-label={`Connected wallet ${address}`}>
        {shortAddress(address)}
      </span>
    );
  }
  const label = status === "connecting" ? "Connecting…" : status === "wrong-network" ? "Switch network" : "Connect wallet";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void connect()} disabled={status === "connecting"} className="min-h-10 border border-line px-3 font-mono text-[11px] tracking-wide text-paper disabled:opacity-60">
        {label}
      </button>
      {error ? <span role="alert" className="max-w-56 text-xs text-abandon">{error}</span> : null}
    </div>
  );
}
