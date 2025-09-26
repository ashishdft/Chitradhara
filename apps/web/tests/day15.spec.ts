import { test, expect, request } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test-user+1@example.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "TestPassword123!";

test.describe("Day 15 - Test Automation Foundation", () => {
  let seededVideo: { videoId: string | number; filePath: string };
  let testUid: string;

  test.beforeEach(async ({ page }) => {
    // 1) ensure test user exists via API
    const apiContext = await request.newContext();
    const ensureResp = await apiContext.post(`${BASE}/api/test-ensure-user`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    expect(ensureResp.ok()).toBeTruthy();
    const ensureJson = await ensureResp.json();
    // ensure API returns uid on success
    testUid = ensureJson.uid || process.env.TEST_USER_UID || "dev-seed-user";

    // 2) seed video for this user by calling seed API with override header (DEV only)
    const seedResp = await apiContext.post(`${BASE}/api/seed-video`, {
      headers: {
        "x-test-uid": testUid,
      },
    });
    expect(seedResp.ok()).toBeTruthy();
    seededVideo = await seedResp.json();
    expect(seededVideo.videoId).toBeTruthy();
  });

  test("upload → watch → delete → restore (UI flow)", async ({ page }) => {
    // 1) login via UI
    await page.goto(`${BASE}/login`);
    // The login page selectors may vary — adjust if your project uses different ids.
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    // wait for redirect to profile or homepage
    await page.waitForURL(`${BASE}/profile`, { timeout: 10000 });

    // 2) Verify seeded video appears in profile
    await page.goto(`${BASE}/profile`);
    // look for card with title "Seeded Test Video"
    const videoCard = page.locator('text=Seeded Test Video').first();
    await expect(videoCard).toBeVisible({ timeout: 10000 });

    // 3) Click to watch
    await videoCard.click();
    // expect URL to be /watch/:id
    await expect(page).toHaveURL(new RegExp(`/watch/${seededVideo.videoId}`), { timeout: 10000 });

    // 4) Check playback element exists (video tag or player)
    const videoEl = page.locator('video').first();
    await expect(videoEl).toBeVisible();

    // 5) Click Delete (UI must have a Delete button on watch or profile)
    // Try buttons in order: [aria-label=Delete], text "Delete", button.delete
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    // After delete, the UI should move video to Trash — go to profile and check Trash
    await page.goto(`${BASE}/profile`);
    await page.click('text=Trash', { timeout: 5000 }).catch(() => {});
    // Expect not in My Videos list
    const notInMyVideos = page.locator('text=Seeded Test Video');
    await expect(notInMyVideos).toBeHidden();

    // 6) Restore via UI: find Restore button in Trash
    const restoreBtn = page.locator('button:has-text("Restore")').first();
    await expect(restoreBtn).toBeVisible({ timeout: 5000 });
    await restoreBtn.click();

    // After restore, check it reappeared in My Videos
    await page.goto(`${BASE}/profile`);
    const backInMyVideos = page.locator('text=Seeded Test Video').first();
    await expect(backInMyVideos).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async () => {
    // cleanup the seeded video using the cleanup API
    const apiContext = await request.newContext();
    await apiContext.post(`${BASE}/api/cleanup-video`, {
      data: { id: seededVideo.videoId, remove_file: true },
      headers: { "x-test-uid": testUid },
    });
  });
});

