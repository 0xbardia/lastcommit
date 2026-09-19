import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";

const root = process.cwd();
const codePath = resolve(root, "contracts/LastCommitRegistry.py");
const resultPath = resolve(root, "artifacts/lastcommit/docs/final-repair-deploy-result.json");
const code = readFileSync(codePath, "utf8");
const sourceHash = createHash("sha256").update(code).digest("hex");
const privateKey = process.env.GENLAYER_DEPLOYER_PRIVATE_KEY?.trim();
const account = createAccount(privateKey ? privateKey : undefined);
const client = createClient({ chain: studionet, account });
const verifyHash = process.argv[2] === "--verify-tx" ? process.argv[3] : undefined;
const out = {
  network: "studionet",
  rpc: "https://studio.genlayer.com/api",
  sourcePath: "contracts/LastCommitRegistry.py",
  sourceSha256: sourceHash,
  deployerAddress: account.address,
  deployerMode: privateKey ? "provided-key" : "ephemeral-deployment-only",
};

function json(value) {
  return JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);
}

function executionSucceeded(receipt) {
  if (receipt?.txExecutionResultName) return receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN;
  const result = receipt?.resultName ?? receipt?.result_name ?? receipt?.result;
  const consensusAgreed = result === "MAJORITY_AGREE" || result === 6 || result === "6";
  const leaders = receipt?.consensus_data?.leader_receipt;
  if (!consensusAgreed || !Array.isArray(leaders) || leaders.length === 0) return false;
  const successful = leaders.filter((leader) => String(leader?.execution_result ?? "").toUpperCase() === "SUCCESS" && leader?.result?.status === "return");
  if (successful.length === 0) return false;
  return leaders.every((leader) => successful.includes(leader) || (String(leader?.execution_result ?? "").toUpperCase() === "ERROR" && leader?.result?.status === "contract_error" && leader?.result?.payload === "idle"));
}

try {
  out.schema = await client.getContractSchemaForCode(code);
  console.log("SCHEMA_OK");
} catch (error) {
  out.schemaError = error instanceof Error ? error.message : String(error);
  console.error("SCHEMA_FAIL", out.schemaError);
}

if (!out.schemaError && verifyHash) {
  try {
    const receipt = await client.getTransaction({ hash: verifyHash });
    out.txHash = verifyHash;
    out.receiptStatus = receipt?.statusName ?? receipt?.status ?? null;
    out.executionResult = executionSucceeded(receipt) ? ExecutionResult.FINISHED_WITH_RETURN : ExecutionResult.FINISHED_WITH_ERROR;
    out.contractAddress = receipt?.data?.contract_address || receipt?.recipient || null;
    out.receipt = receipt;
    if (!executionSucceeded(receipt)) throw new Error("deployment transaction did not prove successful execution");
    console.log("DEPLOYMENT_VERIFIED", out.contractAddress ?? "ADDRESS_NOT_IN_RECEIPT");
  } catch (error) {
    out.deployError = error instanceof Error ? error.message : String(error);
    console.error("VERIFY_FAIL", out.deployError);
  }
} else if (!out.schemaError) {
  try {
    const hash = await client.deployContract({ code, args: [] });
    out.txHash = hash;
    console.log("DEPLOY_TX", hash);
    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.FINALIZED,
      retries: 120,
      interval: 5_000,
    });
    out.receiptStatus = receipt?.statusName ?? receipt?.status ?? null;
    out.executionResult = executionSucceeded(receipt) ? ExecutionResult.FINISHED_WITH_RETURN : ExecutionResult.FINISHED_WITH_ERROR;
    if (!executionSucceeded(receipt)) {
      throw new Error(`deployment execution result was ${receipt?.txExecutionResultName ?? "unknown"}`);
    }
    out.contractAddress = receipt?.contractAddress || receipt?.data?.contract_address || receipt?.recipient || null;
    out.receipt = receipt;
    console.log("DEPLOYMENT_FINALIZED", out.contractAddress ?? "ADDRESS_NOT_IN_RECEIPT");
  } catch (error) {
    out.deployError = error instanceof Error ? error.message : String(error);
    console.error("DEPLOY_FAIL", out.deployError);
  }
}

mkdirSync(dirname(resultPath), { recursive: true });
writeFileSync(resultPath, json(out));
console.log("WROTE_RESULT", resultPath);
if (out.schemaError || out.deployError || !out.contractAddress) process.exitCode = 1;
