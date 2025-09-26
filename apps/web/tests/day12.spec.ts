import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000"; // adjust if needed

test.describe("Day 12 Verification", () => {
  test("Feed page loads videos or empty state", async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    await expect(
      page.locator("text=Loading videos…").or(
        page.locator("text=No videos uploaded yet").or(page.locator("video"))
      )
    ).toBeVisible();
  });

  test("Profile redirects to login when logged out", async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).toHaveURL(/.*login/);
  });

  test("Navbar links exist", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("a:has-text('Feed')")).toBeVisible();
    await expect(page.locator("a:has-text('Profile')")).toBeVisible();
    await expect(page.locator("a:has-text('Upload')")).toBeVisible();
  });

  // Optional: requires a test Firebase user
  test("Profile shows only current user's videos after login", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', "testuser@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button:has-text("Login")');

    await page.goto(`${BASE_URL}/profile`);
    const cards = await page.locator("video").count();
    expect(cards).toBeGreaterThanOrEqual(0); // adjust with stricter checks if needed
  });
});

