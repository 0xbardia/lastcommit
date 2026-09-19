import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";

const root = process.cwd();
const address = process.env.LASTCOMMIT_CONTRACT_ADDRESS || "0x8F1DEEB53214F25341aB3C153d4164dF73DD392c";
const resumeExisting = process.argv.includes("--resume");
const source = readFileSync(resolve(root, "contracts/LastCommitRegistry.py"), "utf8");
const sourceHash = createHash("sha256").update(source).digest("hex");
const readClient = createClient({ chain: studionet });
const account = createAccount();
const writeClient = createClient({ chain: studionet, account });
const secondAccount = createAccount();
const secondWriteClient = createClient({ chain: studionet, account: secondAccount });
const resultPath = resolve(root, "artifacts/lastcommit/docs/final-certification.json");
const log = {
  network: "studionet",
  contract: address,
  sourceSha256: sourceHash,
  resumedFromExistingState: resumeExisting,
  certifierAddress: account.address,
  secondTestAddress: secondAccount.address,
  reads: [],
  writes: [],
  assertions: [],
};

function json(value) {
  return JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item);
}

function executionSucceeded(receipt) {
  if (receipt?.txExecutionResultName) return receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN;
  const result = receipt?.resultName ?? receipt?.result_name ?? receipt?.result;
  const leaders = receipt?.consensus_data?.leader_receipt;
  if (!(result === "MAJORITY_AGREE" || result === 6 || result === "6") || !Array.isArray(leaders) || leaders.length === 0) return false;
  const successful = leaders.filter((leader) => String(leader?.execution_result ?? "").toUpperCase() === "SUCCESS" && leader?.result?.status === "return");
  if (successful.length === 0) return false;
  return leaders.every((leader) => successful.includes(leader) || (String(leader?.execution_result ?? "").toUpperCase() === "ERROR" && leader?.result?.status === "contract_error" && leader?.result?.payload === "idle"));
}

function returnedId(receipt) {
  for (const leader of receipt?.consensus_data?.leader_receipt || []) {
    const readable = leader?.result?.payload?.readable;
    const match = String(readable ?? "").match(/^\s*(\d+)\s*$/);
    if (match && Number(match[1]) > 0) return Number(match[1]);
  }
  return null;
}

async function read(label, functionName, args = []) {
  try {
    const value = await readClient.readContract({ address, functionName, args });
    const row = { label, functionName, args, ok: true, value };
    log.reads.push(row);
    console.log("READ", label, json(value));
    return value;
  } catch (error) {
    const row = { label, functionName, args, ok: false, error: error instanceof Error ? error.message : String(error) };
    log.reads.push(row);
    console.log("READ_FAIL", label, row.error);
    throw error;
  }
}

async function write(label, client, functionName, args = [], expectSuccess = true) {
  let hash = "";
  try {
    hash = String(await client.writeContract({ address, functionName, args, value: 0n }));
    console.log("SUBMITTED", label, hash);
    const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, retries: 180, interval: 5_000 });
    const success = executionSucceeded(receipt);
    const id = success ? returnedId(receipt) : null;
    const row = { label, functionName, args, hash, finalized: true, success, id, status: receipt?.statusName ?? receipt?.status ?? null, execution: success ? ExecutionResult.FINISHED_WITH_RETURN : ExecutionResult.FINISHED_WITH_ERROR };
    log.writes.push(row);
    console.log("FINALIZED", label, json({ hash, success, id, status: row.status, execution: row.execution }));
    if (expectSuccess && (!success || id === null)) throw new Error(`${label} did not finalize with a return value`);
    if (!expectSuccess && success) throw new Error(`${label} unexpectedly succeeded`);
    return row;
  } catch (error) {
    const row = { label, functionName, args, hash: hash || null, finalized: false, success: false, error: error instanceof Error ? error.message : String(error) };
    log.writes.push(row);
    console.log("WRITE_FAIL", label, row.error);
    if (expectSuccess) throw error;
    return row;
  }
}

function assertResult(label, value, predicate) {
  const pass = predicate(value);
  log.assertions.push({ label, pass, value });
  console.log(pass ? "ASSERT_PASS" : "ASSERT_FAIL", label, json(value));
  if (!pass) throw new Error(`assertion failed: ${label}`);
}

async function projectReads(label, projectId, reviewId = 0) {
  const values = {
    project: await read(`${label}_project`, "get_project", [projectId]),
    status: await read(`${label}_status`, "get_project_status", [projectId]),
    latest: await read(`${label}_latest`, "get_latest_review", [projectId]),
    eligible: await read(`${label}_eligible`, "is_succession_eligible", [projectId]),
    reviewCount: await read(`${label}_review_count`, "get_project_review_count", [projectId]),
    history: await read(`${label}_history`, "get_project_reviews", [projectId, 0, 20]),
  };
  if (reviewId > 0) values.review = await read(`${label}_review`, "get_review", [reviewId]);
  return values;
}

async function main() {
  await read("empty_project_count", "get_project_count");
  await read("empty_review_count", "get_review_count");
  await read("unknown_project", "get_project", [999999]);
  await read("unknown_review", "get_review", [999999]);
  await read("unknown_latest", "get_latest_review", [999999]);
  await read("unknown_status", "get_project_status", [999999]);
  await read("unknown_project_review_count", "get_project_review_count", [999999]);
  await read("unknown_project_reviews", "get_project_reviews", [999999, 0, 20]);
  await read("unknown_eligibility", "is_succession_eligible", [999999]);

  let activeId;
  let activeReview;
  if (resumeExisting) {
    activeId = 1;
    const activeExisting = await projectReads("active_existing", activeId, activeId);
    activeReview = { id: Number(activeExisting.review.review_id), hash: "existing" };
    assertResult("existing active fixture is readable", activeExisting.review, (value) => String(value.verdict) === "ACTIVE" && Number(value.loaded_source_count) > 0);
  } else {
    const active = await write("register_active", writeClient, "register_project", [
      "GenLayer JS",
      "Active certification fixture using an actively maintained GenLayer SDK.",
      "https://github.com/genlayerlabs/genlayer-js",
      "https://docs.genlayer.com",
      "https://sdk.genlayer.com",
      "https://github.com/genlayerlabs/genlayer-js/releases",
      "STANDARD",
      "",
      "Community maintainers may initiate a successor project.",
    ]);
    activeId = active.id;
    const activeProject = await read("active_project", "get_project", [activeId]);
    assertResult("registration return binds project ID", activeProject, (value) => Number(value.project_id) === activeId && String(value.owner).toLowerCase() === account.address.toLowerCase());
  }
  await write("unauthorized_update", secondWriteClient, "update_project", [activeId, 1, "Spoofed", "Should fail", "https://github.com/genlayerlabs/genlayer-js", "https://docs.genlayer.com", "https://sdk.genlayer.com", "", "STANDARD", "", ""], false);
  if (!resumeExisting) activeReview = await write("review_active", writeClient, "start_review", [activeId, 1, 0]);
  const activeState = await projectReads("active", activeId, activeReview.id);
  assertResult("active review binds returned ID", activeState.review, (value) => Number(value.review_id) === activeReview.id && Number(value.project_id) === activeId);
  await write("duplicate_review_cooldown", writeClient, "start_review", [activeId, 1, activeReview.id], false);

  const abandoned = await write("register_abandoned", writeClient, "register_project", [
    "Atom Archive",
    "Controlled fixture using an official discontinuation notice and repository archive.",
    "https://github.com/atom/atom",
    "https://paste.rs/WX9kt",
    "https://github.blog/2022-06-08-sunsetting-atom/",
    "",
    "STANDARD",
    "",
    "Community maintainers may initiate a successor project.",
  ]);
  const abandonedId = abandoned.id;
  const abandonedReview = await write("review_abandoned", writeClient, "start_review", [abandonedId, 1, 0]);
  const abandonedState = await projectReads("abandoned", abandonedId, abandonedReview.id);
  assertResult("abandoned fixture has a real evaluated result", abandonedState.review, (value) => ["ACTIVE", "DORMANT", "ABANDONED", "INSUFFICIENT_EVIDENCE"].includes(value.verdict) && Number(value.loaded_source_count) > 0);
  const abandonedVerdict = String(abandonedState.review.verdict);
  if (abandonedVerdict === "ABANDONED") assertResult("abandoned succession is true", abandonedState.eligible, (value) => value === true);

  await write("update_abandoned", writeClient, "update_project", [
    abandonedId,
    1,
    "Atom Archive — reviewed",
    "Updated configuration must invalidate the old review as current proof.",
    "https://github.com/atom/atom",
    "https://paste.rs/WX9kt",
    "https://github.blog/2022-06-08-sunsetting-atom/",
    "",
    "STRICT",
    "",
    "Community maintainers may initiate a successor project.",
  ]);
  const updatedState = await projectReads("updated", abandonedId, abandonedReview.id);
  assertResult("configuration version increments", updatedState.project, (value) => Number(value.config_version) === 2);
  assertResult("historical review remains immutable", updatedState.review, (value) => Number(value.review_id) === abandonedReview.id && String(value.verdict) === abandonedVerdict && Number(value.config_version) === 1);
  assertResult("old review cannot authorize current succession", updatedState.eligible, (value) => value === false);
  const newAbandonedReview = await write("review_updated_abandoned", writeClient, "start_review", [abandonedId, 2, abandonedReview.id]);
  const updatedReview = await read("updated_review", "get_review", [newAbandonedReview.id]);
  assertResult("new review records new configuration", updatedReview, (value) => Number(value.review_id) === newAbandonedReview.id && Number(value.config_version) === 2);
  if (String(updatedReview.verdict) === "ABANDONED") assertResult("new abandonment can restore succession", await read("updated_eligible", "is_succession_eligible", [abandonedId]), (value) => value === true);

  const insufficient = await write("register_insufficient_injection", writeClient, "register_project", [
    "Untrusted Evidence Fixture",
    "Controlled fixture whose public source contains instruction-like text and no trustworthy project record.",
    "https://github.com/lastcommit-certification/prompt-injection-fixture",
    "https://paste.rs/x7028",
    "https://paste.rs/x7028",
    "",
    "STANDARD",
    "",
    "Community maintainers may initiate a successor project.",
  ]);
  const insufficientId = insufficient.id;
  const insufficientReview = await write("review_insufficient_injection", writeClient, "start_review", [insufficientId, 1, 0]);
  const insufficientState = await projectReads("insufficient", insufficientId, insufficientReview.id);
  assertResult("injection fixture does not gain protocol authority", insufficientState.review, (value) => String(value.verdict) === "INSUFFICIENT_EVIDENCE" && value.succession_eligible === false);
  assertResult("duplicate URL categories do not multiply sources", insufficientState.review, (value) => Number(value.loaded_source_count) <= 2);

  await read("final_project_count", "get_project_count");
  await read("final_review_count", "get_review_count");
  await read("pagination_zero", "get_project_reviews", [abandonedId, 0, 20]);
  await read("pagination_limit_zero", "get_project_reviews", [abandonedId, 0, 0]);
  await read("pagination_offset_one", "get_project_reviews", [abandonedId, 1, 20]);
  await read("final_project_status", "get_project_status", [abandonedId]);
  await read("final_latest", "get_latest_review", [abandonedId]);
  await read("final_eligibility", "is_succession_eligible", [abandonedId]);
  console.log("CERTIFICATION_ASSERTIONS", json(log.assertions));
}

try {
  await main();
  log.status = "PASS";
} catch (error) {
  log.status = "FAIL";
  log.failure = error instanceof Error ? error.message : String(error);
  console.error("CERTIFICATION_FAIL", log.failure);
  process.exitCode = 1;
}

mkdirSync(resolve(root, "artifacts/lastcommit/docs"), { recursive: true });
writeFileSync(resultPath, JSON.stringify(log, (_, value) => typeof value === "bigint" ? value.toString() : value, 2));
console.log("WROTE_CERTIFICATION", resultPath);
