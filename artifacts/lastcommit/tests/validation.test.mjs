import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Mirror of src/lib/validation.ts in plain JS for node:test without ts-node
const MAX = { name: 80, description: 500, url: 256, policy: 800 };

function normalizeUrl(url, required, field) {
  const s = (url ?? "").trim();
  if (!s) {
    if (required) throw new Error(`${field} required`);
    return "";
  }
  if (s.length > MAX.url) throw new Error(`${field} exceeds ${MAX.url} characters`);
  const lower = s.toLowerCase();
  if (!lower.startsWith("https://") && !lower.startsWith("http://")) {
    throw new Error(`${field} must use http or https`);
  }
  const host = lower.split("://", 2)[1].split("/")[0].split("@").pop().split(":")[0];
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host)) {
    throw new Error(`${field} rejects private hosts`);
  }
  if (host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("169.254.")) {
    throw new Error(`${field} rejects private hosts`);
  }
  return s;
}

test("accepts public https github url", () => {
  assert.equal(normalizeUrl("https://github.com/org/repo", true, "github_url"), "https://github.com/org/repo");
});

test("rejects javascript scheme", () => {
  assert.throws(() => normalizeUrl("javascript:alert(1)", true, "github_url"));
});

test("rejects localhost", () => {
  assert.throws(() => normalizeUrl("http://localhost/repo", true, "github_url"));
});

test("rejects private network", () => {
  assert.throws(() => normalizeUrl("http://192.168.0.12/x", true, "github_url"));
});

test("optional empty url ok", () => {
  assert.equal(normalizeUrl("", false, "website_url"), "");
});

test("required empty url fails", () => {
  assert.throws(() => normalizeUrl("", true, "github_url"));
});
