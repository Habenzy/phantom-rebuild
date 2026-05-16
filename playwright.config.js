const { defineConfig } = require("@playwright/test");

const demoFirebaseEnv = {
  VITE_FIREBASE_USE_EMULATORS: "true",
  VITE_FIREBASE_API_KEY: "demo-key",
  VITE_FIREBASE_AUTH_DOMAIN: "demo-phantom-reboot.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "demo-phantom-reboot",
  VITE_FIREBASE_STORAGE_BUCKET: "demo-phantom-reboot.appspot.com",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "",
  VITE_FIREBASE_APP_ID: "demo-app-id",
  VITE_FIREBASE_MEASUREMENT_ID: "",
};

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  outputDir: "output/playwright",
  globalSetup: require.resolve("./e2e/global-setup.js"),
  use: {
    baseURL: "http://127.0.0.1:5173",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
  webServer: {
    command: "npm --prefix client run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: demoFirebaseEnv,
  },
});
