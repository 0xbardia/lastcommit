const DEFAULT_LASTCOMMIT_CONTRACT = "0x8F1DEEB53214F25341aB3C153d4164dF73DD392c" as const;
export const LASTCOMMIT_CONTRACT =
  (import.meta.env.VITE_LASTCOMMIT_CONTRACT_ADDRESS || DEFAULT_LASTCOMMIT_CONTRACT) as `0x${string}`;

export const LASTCOMMIT_NETWORK = "studionet";
export const LASTCOMMIT_RPC = "https://studio.genlayer.com/api";
export const LASTCOMMIT_CHAIN_ID = 61999;
export const LASTCOMMIT_SITE_URL = "https://lastcommit.bydx.fun";
// Certified ABANDONED review #5 from the final deployment.
export const FEATURED_PROOF_ID = 5;
export const LASTCOMMIT_DEPLOY_TX =
  "0x78baecf7507373723849e4c5da8c3c2a288810999396ae54f75cc8bbfbab114c" as const;

export const VERDICTS = [
  "ACTIVE",
  "DORMANT",
  "ABANDONED",
  "INSUFFICIENT_EVIDENCE",
  "UNREVIEWED",
  "UNKNOWN",
] as const;

export type Verdict = (typeof VERDICTS)[number];
