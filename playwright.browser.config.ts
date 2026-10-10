import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser-e2e",
  workers: 1,
  timeout: 45000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3102",
    ...devices["Desktop Chrome"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- --port 3102",
    url: "http://127.0.0.1:3102",
    reuseExistingServer: false,
    env: { BROWSER_DEMO: "1" },
  },
});
