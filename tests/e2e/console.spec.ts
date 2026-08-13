import { expect, test } from "@playwright/test";

const PROTECTED_PATHS = ["/dashboard", "/api-keys", "/usage", "/billing", "/members", "/models", "/audit"] as const;

/** Block the real control-plane proxy and simulate an unauthenticated session. */
async function mockUnauthenticated(page: import("@playwright/test").Page) {
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "unauthorized" }) }),
  );
  await page.route("**/api/v1/account/context", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "unauthorized" }) }),
  );
}

test.describe("Console authentication boundary", () => {
  test("login page renders the credential form without sensitive prefill", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h2")).toContainText("Sign in to Console");

    const email = page.locator('input[type="email"]');
    const password = page.locator('input[type="password"]');
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await expect(email).toHaveAttribute("autocomplete", "email");
    await expect(password).toHaveAttribute("autocomplete", "current-password");
    await expect(email).toHaveValue("");
    await expect(password).toHaveValue("");

    await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
  });

  test("empty login form is blocked by client-side validation", async ({ page }) => {
    let loginCalls = 0;
    await page.route("**/api/v1/auth/login", (route) => {
      loginCalls += 1;
      void route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/login");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForTimeout(500);

    expect(loginCalls).toBe(0);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator("h2")).toContainText("Sign in to Console");
  });

  for (const path of PROTECTED_PATHS) {
    test(`${path} redirects unauthenticated visitors to /login`, async ({ page }) => {
      await mockUnauthenticated(page);
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });
      await expect(page.locator("h2")).toContainText("Sign in to Console");
    });
  }
});
