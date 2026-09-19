import { test } from "node:test";
import assert from "node:assert/strict";

function isPrivateHost(host) {
  const h = host.trim().replace(/^\[|\]$/g, "").toLowerCase();
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(h)) return true;
  const parts = h.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const nums = parts.map(Number);
    const [a, b] = nums;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

test("104.x is public", () => {
  assert.equal(isPrivateHost("104.16.1.1"), false);
});
test("10.x is private", () => {
  assert.equal(isPrivateHost("10.0.0.1"), true);
});
test("172.16-31 is private", () => {
  assert.equal(isPrivateHost("172.16.0.1"), true);
  assert.equal(isPrivateHost("172.15.0.1"), false);
});
test("192.168 is private", () => {
  assert.equal(isPrivateHost("192.168.1.1"), true);
});
test("loopback private", () => {
  assert.equal(isPrivateHost("127.0.0.1"), true);
  assert.equal(isPrivateHost("localhost"), true);
});
