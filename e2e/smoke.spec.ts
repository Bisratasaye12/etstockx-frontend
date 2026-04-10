import { test, expect } from "@playwright/test";

test.describe("public shell", () => {
  test("home renders in English locale", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });
});
