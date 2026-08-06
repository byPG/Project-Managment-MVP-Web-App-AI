import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Tests share one live backend/database (no per-test isolation), so they
  // must not run concurrently against it.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["html"],
    ["json", { outputFile: "playwright-report/result.json" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Wide enough that all five columns fit without horizontal
        // scrolling, so drag-and-drop tests land on the intended column
        // instead of racing the board's scroll-into-view auto-scroll.
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
