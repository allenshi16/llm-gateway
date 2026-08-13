import { defineConfig, devices } from "@playwright/test";

const E2E_WEB_URL = process.env.E2E_WEB_URL ?? "http://127.0.0.1:4300";
const E2E_CONSOLE_URL = process.env.E2E_CONSOLE_URL ?? "http://127.0.0.1:4301";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "marketing", testMatch: /marketing\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: E2E_WEB_URL } },
    { name: "console", testMatch: /console\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: E2E_CONSOLE_URL } },
  ],
  webServer: [
    {
      command: "bun run dev:web",
      url: E2E_WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "bun run dev:console-web",
      url: E2E_CONSOLE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
