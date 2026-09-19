import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const server = readFileSync(new URL("../src/lib/lastcommit.ts", import.meta.url), "utf8");
const wallet = readFileSync(new URL("../src/lib/lastcommit-client.ts", import.meta.url), "utf8");

test("production read path never creates a random signer", () => {
  assert.doesNotMatch(server, /createAccount/);
  assert.match(server, /createClient\(\{ chain: studionet \}\)/);
});

test("wallet lifecycle captures hashes and rejects failed execution", () => {
  assert.match(wallet, /eth_requestAccounts/);
  assert.match(wallet, /rememberPending/);
  assert.match(wallet, /onHash\?\.\(hash\)/);
  assert.match(wallet, /FINISHED_WITH_RETURN/);
  assert.match(wallet, /TRANSACTION_FAILED/);
  assert.match(wallet, /expectedConfigVersion/);
  assert.match(wallet, /expectedLatestReviewId/);
});
