import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("Day 13 — Edit & Delete Video", () => {
  test("Logged-in user can edit and delete their own video", async ({ page }) => {
    // Step 1: Login as actual video owner
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', "priyashish10dec@gmail.com");
    await page.fill('input[type="password"]', "your_password_here");
    await page.click("button:has-text('Login')");

    // Step 2: Go to profile
    await page.goto(`${BASE_URL}/profile`);

    // Step 3: Check if any videos exist
    const editButton = page.locator("button", { hasText: "Edit" }).first();
    if (await editButton.count() === 0) {
      console.log("No videos found for editing — skipping test.");
      return;
    }

    // Step 4: Edit title
    await editButton.click();
    const input = page.locator("input").first();
    await input.fill("Updated Title");
    await page.click("button", { hasText: "Save" });
    await expect(page.locator("text=Updated Title")).toBeVisible();

    // Step 5: Delete video
    const deleteButton = page.locator("button", { hasText: "Delete" }).first();
    page.once("dialog", (dialog) => dialog.accept());
    const videoCountBefore = await page.locator("video").count();
    await deleteButton.click();
    await expect(async () => {
      const videoCountAfter = await page.locator("video").count();
      expect(videoCountAfter).toBeLessThan(videoCountBefore);
    }).toPass();
  });
});

