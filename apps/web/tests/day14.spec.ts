import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let seededVideoId: string;

async function ensureUser(request) {
  await request.post(`${BASE_URL}/api/test-ensure-user`, {
    data: {
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    },
  });
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Email").fill(process.env.TEST_USER_EMAIL!);
  await page.getByPlaceholder("Password").fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/profile", { timeout: 30000 });
  await expect(page.locator("text=My Videos")).toBeVisible({ timeout: 30000 });
}

test.describe("Day 14 — Watch, Soft Delete, Restore", () => {
  test.beforeEach(async ({ request, page }) => {
    await ensureUser(request);

    const response = await request.post(`${BASE_URL}/api/seed-video`);
    const data = await response.json();
    seededVideoId = data.videoId;
    // allow storage/db to settle
    await new Promise((res) => setTimeout(res, 1500));

    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await request.delete(`${BASE_URL}/api/cleanup-video?id=${seededVideoId}`);
  });

  test("Watch page loads signed URL", async ({ page }) => {
    const videoLink = page.locator(`a[href="/watch/${seededVideoId}"]`);
    await expect(videoLink).toBeVisible({ timeout: 15000 });
    await videoLink.click();
    await expect(page.locator("video")).toBeVisible({ timeout: 15000 });
  });

  test("Soft delete moves video to Trash", async ({ page }) => {
    await expect(page.locator("text=Seeded Test Video")).toBeVisible({ timeout: 15000 });
    await page.locator('button:has-text("Delete")').first().click();
    await expect(page.locator("text=Trash")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Seeded Test Video")).toBeVisible({ timeout: 15000 });
  });

  test("Restore moves video back", async ({ page }) => {
    await page.locator('button:has-text("Delete")').first().click();
    await expect(page.locator("text=Trash")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Seeded Test Video")).toBeVisible({ timeout: 15000 });

    await page.locator('button:has-text("Restore")').first().click();
    await expect(page.locator("text=My Videos")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Seeded Test Video")).toBeVisible({ timeout: 15000 });
  });
});

