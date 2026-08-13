import { expect, test } from "@playwright/test";

test.describe("Marketing site (public SEO surface)", () => {
  test("homepage renders crawlable hero content and navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("One calm control plane for every model route.");
    await expect(page.getByText("OpenAI-compatible gateway", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Platform", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Models", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pricing", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Resources", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("models page exposes model families and crawlable metadata", async ({ page }) => {
    await page.goto("/models");
    await expect(page).toHaveTitle(/Supported LLM models/);
    await expect(page.locator("h1")).toContainText("Choose the model. Keep the interface.");
    await expect(page.locator("main")).toContainText("DeepSeek");
    await expect(page.locator("main")).toContainText("Qwen");
    await expect(page.locator("main")).toContainText("Kimi and GLM");
  });

  for (const path of ["/platform", "/pricing", "/resources", "/docs"] as const) {
    test(`${path} returns a rendered page with a heading`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("h1")).not.toBeEmpty();
    });
  }

  test("robots.txt exposes the sitemap and allows crawling", async ({ page }) => {
    const response = await page.request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();
    const body = (await response.text()).toLowerCase();
    expect(body).toContain("user-agent: *");
    expect(body).toContain("sitemap:");
    expect(body).toContain("/sitemap.xml");
  });

  test("sitemap.xml lists all crawlable routes", async ({ page }) => {
    await expect
      .poll(async () => (await page.request.get("/sitemap.xml")).ok(), { timeout: 20_000 })
      .toBeTruthy();
    const response = await page.request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/models");
    expect(body).toContain("/pricing");
    expect(body).toContain("/platform");
  });
});
