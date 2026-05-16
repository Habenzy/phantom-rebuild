const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { expect } = require("@playwright/test");

const repoRoot = path.resolve(__dirname, "../..");
const uploadFixture = path.join(repoRoot, "client/src/assets/testpattern.gif");

function seedEmulator() {
  try {
    execFileSync("npm", ["run", "emulators:seed"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: "pipe",
      env: {
        ...process.env,
        FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      },
    });
  } catch (err) {
    throw new Error(
      [
        "Unable to seed Firebase emulators. Start Auth, Firestore, and Storage emulators before running Playwright.",
        err.stdout,
        err.stderr,
      ]
        .filter(Boolean)
        .join("\n")
    );
  }
}

async function logIn(page, route, credentials) {
  await page.goto(route);
  await page.getByPlaceholder("enter your email address").fill(credentials.email);
  await page.getByPlaceholder("enter your password").fill(credentials.password);
  await page.getByRole("button", { name: "Log In" }).click();
}

async function signUp(page, email, password) {
  await page.goto("/ArtistPortal");
  await page.getByPlaceholder("enter your email address").fill(email);
  await page.getByPlaceholder("enter your password").fill(password);
  await page.getByRole("button", { name: "Sign Up" }).click();
}

async function clickAndAcceptDialog(page, locator, expectedMessage) {
  const dialogPromise = page.waitForEvent("dialog");
  await locator.click();
  const dialog = await dialogPromise;

  if (expectedMessage) {
    expect(dialog.message()).toMatch(expectedMessage);
  }

  await dialog.accept();
}

async function uploadImage(inputLocator) {
  await inputLocator.setInputFiles(uploadFixture);
}

async function fillByName(scope, name, value) {
  await scope.locator(`[name="${name}"]`).fill(value);
}

module.exports = {
  clickAndAcceptDialog,
  fillByName,
  logIn,
  seedEmulator,
  signUp,
  uploadImage,
};
