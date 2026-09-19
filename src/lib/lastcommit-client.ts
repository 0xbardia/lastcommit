import { invalidateLastCommitCache } from "./lastcommit";
import type { ProjectInput } from "./project-validation";
import { validateProjectInput } from "./project-validation";
import { LASTCOMMIT_CONTRACT, LASTCOMMIT_NETWORK } from "./contract-config";
import { TransactionStatus } from "genlayer-js/types";

type ProviderMessage = { method: string; params?: unknown[] };

export type Eip1193Provider = {
  request: (request: ProviderMessage) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export type WalletErrorCode =
  | "WALLET_UNAVAILABLE"
  | "WRONG_NETWORK"
  | "TRANSACTION_REJECTED"
  | "TRANSACTION_FAILED"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "INVALID_INPUT"
  | "UNKNOWN_ERROR";

export class WalletError extends Error {
  constructor(
    public readonly code: WalletErrorCode,
    message: string,
    public readonly hash?: string,
  ) {
    super(message);
    this.name = "WalletError";
  }
}

export type PendingTransaction = {
  method: "register_project" | "update_project" | "start_review";
  projectId?: number;
  hash: string;
  submittedAt: string;
  network: string;
};

const PENDING_KEY = "lastcommit.pending-transactions";
const STUDIONET_CHAIN_ID = "0x" + (61999).toString(16);

function provider(): Eip1193Provider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new WalletError("WALLET_UNAVAILABLE", "Connect an EIP-1193 wallet to continue.");
  }
  return window.ethereum;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) return String(error.code);
  return "";
}

function isRateLimited(error: unknown): boolean {
  const message = errorText(error).toLowerCase();
  return message.includes("429") || message.includes("rate limit") || message.includes("too many requests");
}

function isTimeout(error: unknown): boolean {
  const message = errorText(error).toLowerCase();
  return message.includes("timeout") || message.includes("timed out") || message.includes("deadline");
}

function toWalletError(error: unknown, fallback: WalletErrorCode = "UNKNOWN_ERROR", hash?: string): WalletError {
  if (error instanceof WalletError) return hash && !error.hash ? new WalletError(error.code, error.message, hash) : error;
  const code = errorCode(error);
  const message = errorText(error).toLowerCase();
  if (code === "4001" || message.includes("user rejected") || message.includes("user denied") || message.includes("rejected")) {
    return new WalletError("TRANSACTION_REJECTED", "The wallet rejected the request.", hash);
  }
  if (isRateLimited(error)) return new WalletError("RATE_LIMITED", "GenLayer Studio is temporarily rate limited. Try again shortly.", hash);
  if (isTimeout(error)) return new WalletError("TIMEOUT", "GenLayer Studio took too long to finalize this transaction. The hash is saved for recovery.", hash);
  if (message.includes("wallet is on chain") || message.includes("wrong network") || message.includes("chain")) {
    return new WalletError("WRONG_NETWORK", "Switch your wallet to GenLayer Studionet and try again.", hash);
  }
  if (fallback === "TRANSACTION_FAILED") return new WalletError(fallback, "The transaction finalized with a contract execution failure.", hash);
  return new WalletError(fallback, "The wallet request could not be completed.", hash);
}

function readPending(): PendingTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PendingTransaction => Boolean(item && typeof item.hash === "string"));
  } catch {
    return [];
  }
}

function writePending(items: PendingTransaction[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(items.slice(-8)));
  } catch {
    // Recovery storage is optional; contract state remains authoritative.
  }
}

export function getPendingTransactions(): PendingTransaction[] {
  return readPending();
}

function rememberPending(item: PendingTransaction) {
  writePending([...readPending().filter((entry) => entry.hash !== item.hash), item]);
}

function forgetPending(hash: string) {
  writePending(readPending().filter((entry) => entry.hash !== hash));
}

export async function connectWallet(): Promise<string> {
  const wallet = provider();
  try {
    const accounts = await wallet.request({ method: "eth_requestAccounts" });
    const address = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : "";
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) throw new WalletError("WALLET_UNAVAILABLE", "The wallet did not return an account.");
    const chainId = String(await wallet.request({ method: "eth_chainId" })).toLowerCase();
    if (chainId !== STUDIONET_CHAIN_ID) {
      const { createClient } = await import("genlayer-js");
      const { studionet } = await import("genlayer-js/chains");
      const client = createClient({ chain: studionet, provider: wallet as never });
      await client.connect("studionet");
      const updatedChainId = String(await wallet.request({ method: "eth_chainId" })).toLowerCase();
      if (updatedChainId !== STUDIONET_CHAIN_ID) throw new WalletError("WRONG_NETWORK", "Switch your wallet to GenLayer Studionet to continue.");
    }
    return address;
  } catch (error) {
    throw toWalletError(error, "WALLET_UNAVAILABLE");
  }
}

export function currentWalletProvider(): Eip1193Provider | null {
  return typeof window !== "undefined" ? window.ethereum ?? null : null;
}

async function walletClient(address: string) {
  const wallet = provider();
  const { createClient } = await import("genlayer-js");
  const { studionet } = await import("genlayer-js/chains");
  return createClient({
    chain: studionet,
    account: address as `0x${string}`,
    provider: wallet as never,
  });
}

function returnedId(receipt: unknown): number | null {
  const root = receipt as Record<string, unknown> | null;
  const consensus = root?.consensus_data as Record<string, unknown> | undefined;
  const leaders = consensus?.leader_receipt;
  if (!Array.isArray(leaders)) return null;
  for (const leader of leaders) {
    const result = (leader as Record<string, unknown>)?.result;
    const payload = result && typeof result === "object" ? (result as Record<string, unknown>).payload : null;
    const readable = payload && typeof payload === "object" ? (payload as Record<string, unknown>).readable : null;
    const candidate = typeof readable === "string" || typeof readable === "number" ? String(readable) : "";
    const match = candidate.match(/^\s*(\d+)\s*$/);
    if (match) {
      const id = Number(match[1]);
      if (Number.isSafeInteger(id) && id > 0) return id;
    }
  }
  return null;
}

function executionSucceeded(receipt: unknown): boolean {
  const root = receipt as Record<string, unknown> | null;
  if (root?.txExecutionResultName) return root.txExecutionResultName === "FINISHED_WITH_RETURN";
  const result = root?.resultName ?? root?.result_name ?? root?.result;
  const consensusAgreed = result === "MAJORITY_AGREE" || result === 6 || result === "6";
  const consensus = root?.consensus_data as Record<string, unknown> | undefined;
  const leaders = consensus?.leader_receipt;
  if (!consensusAgreed || !Array.isArray(leaders) || leaders.length === 0) return false;
  const successful = leaders.filter((leader) => {
    const value = leader as Record<string, unknown>;
    const execution = String(value.execution_result ?? "").toUpperCase();
    const leaderResult = value.result as Record<string, unknown> | undefined;
    return execution === "SUCCESS" && leaderResult?.status === "return";
  });
  if (successful.length === 0) return false;
  return leaders.every((leader) => {
    const value = leader as Record<string, unknown>;
    const execution = String(value.execution_result ?? "").toUpperCase();
    const leaderResult = value.result as Record<string, unknown> | undefined;
    const quorumStop = execution === "ERROR" && leaderResult?.status === "contract_error" && leaderResult.payload === "idle";
    return successful.includes(leader) || quorumStop;
  });
}

async function finalize(
  address: string,
  method: PendingTransaction["method"],
  args: unknown[],
  projectId: number | undefined,
  onHash?: (hash: string) => void,
) {
  const client = await walletClient(address);
  let hash = "";
  try {
    hash = String(
      await client.writeContract({
        address: LASTCOMMIT_CONTRACT,
        functionName: method,
        value: 0n,
        args,
      } as never),
    );
    rememberPending({ method, ...(projectId ? { projectId } : {}), hash, submittedAt: new Date().toISOString(), network: LASTCOMMIT_NETWORK });
    onHash?.(hash);
  } catch (error) {
    throw toWalletError(error, "TRANSACTION_REJECTED");
  }

  try {
    const receipt = await client.waitForTransactionReceipt({
      hash: hash as never,
      status: TransactionStatus.FINALIZED,
      retries: method === "start_review" ? 180 : 100,
      interval: method === "start_review" ? 5_000 : 4_000,
    });
    if (!executionSucceeded(receipt)) {
      forgetPending(hash);
      throw new WalletError("TRANSACTION_FAILED", "The transaction finalized but contract execution failed.", hash);
    }
    const id = returnedId(receipt);
    if (id === null) {
      forgetPending(hash);
      throw new WalletError("TRANSACTION_FAILED", "The transaction finalized without a usable contract result.", hash);
    }
    forgetPending(hash);
    try {
      await invalidateLastCommitCache();
    } catch {
      // The next read still becomes fresh after the short server cache window.
    }
    return { hash, status: "FINALIZED" as const, id };
  } catch (error) {
    throw toWalletError(error, "TRANSACTION_FAILED", hash);
  }
}

function assertValidInput(input: ProjectInput) {
  const errors = validateProjectInput(input);
  const first = Object.values(errors)[0];
  if (first) throw new WalletError("INVALID_INPUT", first);
}

export async function registerProject(
  input: ProjectInput,
  onHash?: (hash: string) => void,
) {
  assertValidInput(input);
  const address = await connectWallet();
  return finalize(address, "register_project", [
    input.name.trim(),
    input.description.trim(),
    input.github_url.trim(),
    input.website_url.trim(),
    input.docs_url.trim(),
    input.announcement_url.trim(),
    input.policy_kind,
    input.custom_policy.trim(),
    input.succession_note.trim(),
  ], undefined, onHash);
}

export async function updateProject(
  input: ProjectInput & { projectId: number; expectedConfigVersion: number },
  onHash?: (hash: string) => void,
) {
  assertValidInput(input);
  const address = await connectWallet();
  return finalize(address, "update_project", [
    input.projectId,
    input.expectedConfigVersion,
    input.name.trim(),
    input.description.trim(),
    input.github_url.trim(),
    input.website_url.trim(),
    input.docs_url.trim(),
    input.announcement_url.trim(),
    input.policy_kind,
    input.custom_policy.trim(),
    input.succession_note.trim(),
  ], input.projectId, onHash);
}

export async function startProjectReview(
  input: { projectId: number; expectedConfigVersion: number; expectedLatestReviewId: number },
  onHash?: (hash: string) => void,
) {
  if (!Number.isInteger(input.projectId) || input.projectId <= 0) throw new WalletError("INVALID_INPUT", "Project IDs must be positive integers.");
  const address = await connectWallet();
  return finalize(address, "start_review", [input.projectId, input.expectedConfigVersion, input.expectedLatestReviewId], input.projectId, onHash);
}
