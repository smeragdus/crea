import { defineConfig, devices } from "@playwright/test";

const existingServer = process.env.CREA_E2E_URL;
const baseURL = existingServer || "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "test-results/browser",
  fullyParallel: true,
  workers: 2,
  timeout: 45000,
  use: {
    baseURL,
    channel: process.env.CREA_BROWSER_CHANNEL || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: existingServer ? undefined : {
    command: "pnpm exec next dev --port 3100 --hostname 127.0.0.1",
    env: { NEXT_PUBLIC_CREA_DEMO: "true" },
    url: baseURL,
    timeout: 90000,
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "tableta", use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: "movil", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
