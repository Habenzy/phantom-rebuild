const { test, expect } = require("@playwright/test");
const {
  clickAndAcceptDialog,
  fillByName,
  logIn,
  seedEmulator,
  uploadImage,
} = require("./support/actions");
const { adminCredentials, artistCredentials } = require("./support/credentials");
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

async function logInAsAdmin(page) {
  await logIn(page, "/adminDash", adminCredentials);
  await expect(page.getByRole("button", { name: "Edit Shows" })).toBeVisible();
}

test("invalid admin login displays an error banner", async ({ page }) => {
  await logIn(page, "/adminDash", {
    email: adminCredentials.email,
    password: "wrong-password",
  });

  await expect(page.locator(".err-banner")).toContainText(/invalid|auth|password/i);
});

test("non-admin user fails closed with forbidden state", async ({ page }) => {
  await logIn(page, "/adminDash", artistCredentials);

  await expect(page.getByRole("heading", { name: "403: Forbidden" })).toBeVisible();
});

test("admin login loads shows, artists, and donors", async ({ page }) => {
  await logInAsAdmin(page);

  await expect(page.getByTestId("admin-show-card-seed-show")).toContainText(
    "Seeded Summer Show"
  );
  await expect(page.getByTestId("admin-show-card-seed-admin-proposal")).toContainText(
    "Seeded Admin Proposal"
  );
  await expect(page.getByTestId("admin-donor-seed-donor")).toContainText("Example Donor");

  await page.getByRole("button", { name: "Edit Artist Profiles" }).click();

  await expect(
    page.locator('[data-testid^="admin-artist-profile-"]').filter({ hasText: "Example Artist" })
  ).toBeVisible();
});

test("admin filters shows by status", async ({ page }) => {
  await logInAsAdmin(page);

  await page.getByTestId("admin-show-filter").selectOption("proposed");
  await expect(page.getByTestId("admin-show-card-seed-admin-proposal")).toBeVisible();
  await expect(page.getByTestId("admin-show-card-seed-show")).toHaveCount(0);

  await page.getByTestId("admin-show-filter").selectOption("booked");
  await expect(page.getByTestId("admin-show-card-seed-show")).toBeVisible();
  await expect(page.getByTestId("admin-show-card-seed-admin-proposal")).toHaveCount(0);

  await page.getByTestId("admin-show-filter").selectOption("archived");
  await expect(page.getByTestId("admin-show-card-seed-artist-edit-show")).toBeVisible();
  await expect(page.getByTestId("admin-show-card-seed-show")).toHaveCount(0);
});

test("admin books a proposed show and public pages reflect it", async ({ page }) => {
  await logInAsAdmin(page);

  const card = page.getByTestId("admin-show-card-seed-admin-proposal");
  await expect(card).toBeVisible();

  await card.getByTestId("admin-show-status").selectOption("booked");
  await fillByName(card, "blurb", "Booked publicly by Playwright.");
  await fillByName(card, "title", "E2E Admin Booked Show");
  await fillByName(card, "contact", "E2E Admin Producer");
  await fillByName(card, "type", "Music");

  await uploadImage(card.getByTestId("admin-cover-upload"));
  await clickAndAcceptDialog(page, card.getByTestId("admin-cover-upload-button"), /Image uploaded/);

  await card.getByTestId("admin-add-show-time").click();
  await card.getByTestId("admin-show-date").fill("2099-07-04T19:30");
  await card.getByTestId("admin-ticket-link").fill("https://tickets.example.com/e2e-admin");
  await card.getByTestId("admin-confirm-show-time").click();

  await clickAndAcceptDialog(
    page,
    card.getByTestId("admin-submit-show"),
    /Show updated successfully/
  );

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "E2E Admin Booked Show" })).toBeVisible();

  await page.goto("/Season");
  const bookedShow = page.locator("#seed-admin-proposal");
  await expect(bookedShow.getByRole("heading", { name: /E2E Admin Booked Show/ })).toBeVisible();
  await expect(bookedShow.getByText("Booked publicly by Playwright.")).toBeVisible();
  await expect(bookedShow.getByRole("link", { name: /buy tickets/i })).toHaveAttribute(
    "href",
    "https://tickets.example.com/e2e-admin"
  );
});

test("admin edits an artist profile and public Artists reflects it", async ({ page }) => {
  await logInAsAdmin(page);
  await page.getByRole("button", { name: "Edit Artist Profiles" }).click();

  const profile = page.locator('[data-testid^="admin-artist-profile-"]').first();
  await expect(profile).toBeVisible();
  await expect(profile).toContainText("Example Artist");

  await uploadImage(profile.getByTestId("admin-artist-upload"));
  await clickAndAcceptDialog(
    page,
    profile.getByTestId("admin-artist-upload-button"),
    /Image uploaded/
  );
  await fillByName(profile, "artist", "E2E Admin Managed Artist");
  await fillByName(profile, "email", "managed@example.com");
  await fillByName(profile, "bio", "Managed by the admin browser workflow.");

  await clickAndAcceptDialog(
    page,
    profile.getByRole("button", { name: "Update artist information" }),
    /Artist profile updated successfully/
  );
  await page.goto("/Artists");

  await expect(page.getByRole("heading", { name: "E2E Admin Managed Artist" })).toBeVisible();
  await expect(page.getByText("Managed by the admin browser workflow.")).toBeVisible();
  await expect(page.getByText("managed@example.com")).toBeVisible();
});

test("admin adds and deletes donors", async ({ page }) => {
  await logInAsAdmin(page);

  await page.getByLabel("New Donor").fill("E2E Browser Donor");
  await clickAndAcceptDialog(page, page.getByRole("button", { name: "Add Donor" }), /New donor/);

  await page.goto("/Donate");
  await expect(page.getByText("E2E Browser Donor")).toBeVisible();

  await page.goto("/adminDash");
  await expect(page.getByRole("button", { name: "Edit Shows" })).toBeVisible();
  await clickAndAcceptDialog(
    page,
    page.getByTestId("admin-donor-seed-delete-donor").getByRole("button", { name: "Delete" }),
    /Delete Me Donor removed/
  );

  await page.goto("/Donate");
  await expect(page.getByText("Example Donor")).toBeVisible();
  await expect(page.getByText("Delete Me Donor")).toHaveCount(0);
});
