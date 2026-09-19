import { test, expect } from "@playwright/test";

test("landing and core routes render", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /maintenance stops/i })).toBeVisible();
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: /registered projects/i })).toBeVisible();
  await page.goto("/projects/new");
  await expect(page.getByRole("heading", { name: /register a project/i })).toBeVisible();
  await page.goto("/docs");
  await expect(page.getByRole("heading", { name: /protocol notes/i })).toBeVisible();
  expect(errors).toEqual([]);
});
