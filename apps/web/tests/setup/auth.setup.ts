import { test as setup, expect } from "@playwright/test";
import { createUser, deleteUser } from "../utils/test-user";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL!;
  const password = process.env.TEST_USER_PASSWORD!;
  
  // Create test user if it doesn't exist
  await createUser(email, password);
  
  // Perform authentication
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to profile page
  await page.waitForURL("/profile");
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  // Verify authentication worked
  await expect(page.locator("h1")).toHaveText("My Videos");
});

// Cleanup after all tests
setup.afterAll(async () => {
  if (process.env.CLEANUP_TEST_USER !== "false") {
    await deleteUser(process.env.TEST_USER_EMAIL!);
  }
});
