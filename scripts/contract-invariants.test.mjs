import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const source = readFileSync(new URL("../contracts/LastCommitRegistry.py", import.meta.url), "utf8");

test("final contract schema exposes transaction-bound IDs and paginated history", async () => {
  const schema = await createClient({ chain: studionet }).getContractSchemaForCode(source);
  assert.equal(schema.methods.register_project.ret, "int");
  assert.equal(schema.methods.start_review.ret, "int");
  assert.equal(schema.methods.update_project.ret, "int");
  assert.deepEqual(schema.methods.start_review.params.map(([name]) => name), [
    "project_id",
    "expected_config_version",
    "expected_latest_review_id",
  ]);
  assert.deepEqual(schema.methods.get_project_reviews.params.map(([name]) => name), ["project_id", "offset", "limit"]);
  assert.ok(schema.methods.get_project_review_count);
});

test("contract source keeps evidence and succession invariants in the write path", () => {
  assert.match(source, /run_nondet\(collect_input, validate_evidence\)/);
  assert.match(source, /actual_loaded_source_count == 0/);
  assert.match(source, /if not complete or actual_loaded_source_count == 0/);
  assert.match(source, /review\.config_version == project\.config_version/);
  assert.match(source, /stale review configuration/);
  assert.match(source, /stale review request/);
  assert.match(source, /REVIEW_COOLDOWN_SECONDS/);
  assert.match(source, /review cooldown active/);
  assert.match(source, /github_url must use github\.com/);
  assert.match(source, /project_review_ids: TreeMap\[u256, u256\]/);
});
