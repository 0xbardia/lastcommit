import { test, expect } from "playwright/test";

const readOnlyRoutes = [
  "/",
  "/app",
  "/projects/1",
  "/projects/4",
  "/projects/5",
  "/proof/1",
  "/proof/5",
  "/proof/6",
  "/docs",
  "/projects/abc",
  "/proof/abc",
  "/does-not-exist",
];

test("core routes render without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  for (const route of readOnlyRoutes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBeLessThan(500);
    await expect(page.locator("body")).toContainText(/LastCommit/i);
  }
  expect(errors).toEqual([]);
});

test("certified verdict routes expose their product states", async ({ page }) => {
  await page.goto("/projects/1");
  await expect(page.getByRole("heading", { name: "GenLayer JS" })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole("status", { name: "Verdict: ACTIVE" }).first()).toBeVisible();

  await page.goto("/projects/4");
  await expect(page.getByRole("heading", { name: /Atom Archive/ })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole("status", { name: "Verdict: ABANDONED" }).first()).toBeVisible();

  await page.goto("/projects/5");
  await expect(page.getByRole("heading", { name: "Untrusted Evidence Fixture" })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole("status", { name: "Verdict: INSUFFICIENT_EVIDENCE" }).first()).toBeVisible();

  await page.goto("/proof/5");
  await expect(page.getByText("LastCommit proof", { exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.getByText("SUCCESSION ELIGIBLE", { exact: true })).toBeVisible();
});

test("registration remains safe while disconnected", async ({ page }) => {
  await page.goto("/projects/new");
  await expect(page.getByRole("heading", { name: /Register a project/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /connect wallet to register/i })).toBeVisible();
  await expect(page.getByLabel("GitHub repository")).toHaveAttribute("aria-invalid", "false");
  await page.getByLabel("Name").fill("Read-only browser fixture");
  await page.getByLabel("Description").fill("This form is intentionally not submitted during browser certification.");
  await page.getByLabel("GitHub repository").fill("https://github.com/example/project");
  await page.getByRole("button", { name: /connect wallet to register/i }).click();
  await expect(page.getByRole("alert")).toContainText(/wallet/i);
});

test("metadata and narrow layout remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/proof/5");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Proof of Abandonment/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /LastCommit Proof/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
});
