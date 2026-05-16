const { test, expect } = require("@playwright/test");
const {
  clickAndAcceptDialog,
  fillByName,
  logIn,
  seedEmulator,
  signUp,
  uploadImage,
} = require("./support/actions");
const { artistCredentials } = require("./support/credentials");
const {
  blockExternalRequests,
  expectNoExternalRequests,
} = require("./support/local-network");

let blockedRequests = [];

test.beforeEach(async ({ page }) => {
  seedEmulator();
  blockedRequests = await blockExternalRequests(page);
});

test.afterEach(() => {
  expectNoExternalRequests(blockedRequests);
});

test("invalid artist login displays an error banner", async ({ page }) => {
  await logIn(page, "/ArtistPortal", {
    email: artistCredentials.email,
    password: "wrong-password",
  });

  await expect(page.locator(".err-banner")).toContainText(/invalid|auth|password/i);
});

test("new artist sign-up creates an authenticated portal session", async ({ page }) => {
  const email = `e2e-artist-${Date.now()}@example.com`;

  await signUp(page, email, artistCredentials.password);

  await expect(page.getByRole("button", { name: "Create Show Proposal" })).toBeVisible();
  await expect(page.getByTestId("artist-profile-form")).toBeVisible();
});

test("seeded artist login loads profile and submitted shows", async ({ page }) => {
  await logIn(page, "/ArtistPortal", artistCredentials);

  await expect(
    page.getByRole("heading", {
      name: /Welcome Example Artist to your Phantom Theater Artist portal/i,
    })
  ).toBeVisible();
  await expect(page.getByTestId("artist-show-seed-artist-edit-show")).toContainText(
    "Seeded Artist Draft - archived"
  );
});

test("artist updates profile, uploads image, and public Artists reflects it", async ({ page }) => {
  await logIn(page, "/ArtistPortal", artistCredentials);
  await expect(page.getByTestId("artist-profile-form")).toBeVisible();

  await uploadImage(page.getByTestId("artist-profile-upload"));
  await clickAndAcceptDialog(
    page,
    page.getByTestId("artist-profile-upload-button"),
    /Image uploaded/
  );

  const profileForm = page.getByTestId("artist-profile-form");
  await fillByName(profileForm, "artist", "E2E Updated Artist");
  await fillByName(profileForm, "phone", "802-555-9999");
  await fillByName(profileForm, "email", "artist-updated@example.com");
  await fillByName(profileForm, "bio", "Updated by a Playwright browser test.");
  await fillByName(profileForm, "website", "https://updated.example.com");
  await fillByName(profileForm, "fb", "https://facebook.com/updated");
  await fillByName(profileForm, "insta", "https://instagram.com/updated");
  await fillByName(profileForm, "spotify", "https://spotify.com/updated");
  await fillByName(profileForm, "youtube", "https://youtube.com/updated");

  await clickAndAcceptDialog(
    page,
    page.getByRole("button", { name: "Update your information" }),
    /profile successfully updated/
  );

  await page.goto("/Artists");

  await expect(page.getByRole("heading", { name: "E2E Updated Artist" })).toBeVisible();
  await expect(page.getByText("Updated by a Playwright browser test.")).toBeVisible();
  await expect(page.getByText("artist-updated@example.com")).toBeVisible();
  await expect(page.getByRole("link", { name: "Website" })).toHaveAttribute(
    "href",
    "https://updated.example.com"
  );
});

test("artist creates a show proposal with uploaded images", async ({ page }) => {
  await logIn(page, "/ArtistPortal", artistCredentials);

  await page.getByRole("button", { name: "Create Show Proposal" }).click();
  const proposalForm = page.getByTestId("artist-proposal-form");
  await expect(proposalForm).toBeVisible();

  await fillByName(proposalForm, "title", "E2E Artist Proposal");
  await fillByName(proposalForm, "contact", "E2E Producer");
  await fillByName(proposalForm, "type", "Theater");
  await fillByName(proposalForm, "description", "A proposal created by Playwright.");

  await uploadImage(proposalForm.getByTestId("artist-proposal-cover-upload"));
  await clickAndAcceptDialog(
    page,
    proposalForm.getByTestId("artist-proposal-cover-upload-button"),
    /Image uploaded/
  );
  await uploadImage(proposalForm.getByTestId("artist-proposal-second-upload"));
  await clickAndAcceptDialog(
    page,
    proposalForm.getByTestId("artist-proposal-second-upload-button"),
    /Image uploaded/
  );
  await uploadImage(proposalForm.getByTestId("artist-proposal-third-upload"));
  await clickAndAcceptDialog(
    page,
    proposalForm.getByTestId("artist-proposal-third-upload-button"),
    /Image uploaded/
  );

  await expect(proposalForm.getByTestId("artist-proposal-submit")).toBeEnabled();
  await clickAndAcceptDialog(
    page,
    proposalForm.getByTestId("artist-proposal-submit"),
    /Show added successfully/
  );
  await expect(page.getByTestId("artist-proposal-form")).toHaveCount(0);
});

test("artist edits an existing owned show and sees it after returning to the portal", async ({
  page,
}) => {
  await logIn(page, "/ArtistPortal", artistCredentials);

  const editForm = page.getByTestId("artist-edit-show-form-seed-artist-edit-show");
  await expect(editForm).toBeVisible();

  await fillByName(editForm, "title", "E2E Edited Artist Show");
  await fillByName(editForm, "description", "Artist show edited by Playwright.");

  await clickAndAcceptDialog(
    page,
    editForm.getByTestId("artist-edit-submit"),
    /Show Updated Successfully/
  );

  await page.goto("/About");
  await page.goto("/ArtistPortal");

  await expect(page.getByTestId("artist-show-seed-artist-edit-show")).toContainText(
    "E2E Edited Artist Show - archived"
  );
});

test("artist logout returns to the login form", async ({ page }) => {
  await logIn(page, "/ArtistPortal", artistCredentials);
  await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();

  await page.getByRole("button", { name: "Log Out" }).click();

  await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();
  await expect(page.getByPlaceholder("enter your email address")).toBeVisible();
});
