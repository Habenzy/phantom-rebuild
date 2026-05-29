const { test, expect } = require("@playwright/test");
const { seedEmulator } = require("./support/actions");
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

test("home renders seeded booked show and links to its season detail", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Seeded Summer Show" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Show Times Coming Soon!" })).toHaveCount(0);
  await expect(page.getByAltText("Now Showing")).toHaveAttribute(
    "src",
    /^data:image\/gif/
  );

  await page.getByRole("link", { name: "More Info" }).first().click();

  await expect(page).toHaveURL(/\/Season#seed-show$/);
  await expect(page.locator("#seed-show")).toContainText("Seeded Summer Show");
});

test("season renders seeded show, artist, date, image, and ticket link", async ({ page }) => {
  await page.goto("/Season");

  const seededShow = page.locator("#seed-show");
  await expect(seededShow.getByRole("heading", { name: /Seeded Summer Show/ })).toBeVisible();
  await expect(seededShow.getByRole("heading", { name: "Example Artist" })).toBeVisible();
  await expect(seededShow.getByText("A seeded booked show for local regression testing.")).toBeVisible();
  await expect(seededShow.getByAltText("show-image").first()).toHaveAttribute(
    "src",
    /^data:image\/gif/
  );
  await expect(seededShow.getByRole("link", { name: /buy tickets/i })).toHaveAttribute(
    "href",
    "https://theaterengine.com/companies/1"
  );
});

test("artists renders seeded profile and social links", async ({ page }) => {
  await page.goto("/Artists");

  await expect(page.getByRole("heading", { name: "Example Artist" })).toBeVisible();
  await expect(page.getByText("A seeded artist profile for local development.")).toBeVisible();
  await expect(page.getByText("artist@example.com")).toBeVisible();
  await expect(page.getByRole("link", { name: "Website" })).toHaveAttribute(
    "href",
    "https://example.com"
  );
  await expect(page.getByRole("link", { name: "Instagram" })).toHaveAttribute(
    "href",
    "https://instagram.com/example"
  );
  await expect(page.getByRole("link", { name: "YouTube" })).toHaveAttribute(
    "href",
    "https://youtube.com/example"
  );
});

test("donate renders seeded donors and PayPal donate href", async ({ page }) => {
  await page.goto("/Donate");

  await expect(page.getByText("Example Donor")).toBeVisible();
  await expect(page.locator('.donate a[href*="paypal.com/donate"]')).toHaveAttribute(
    "href",
    "https://www.paypal.com/donate/?hosted_button_id=CU35GHQ4HTM6C"
  );
});

test("desktop nav routes across public pages", async ({ page }) => {
  await page.goto("/");

  const nav = page.getByRole("navigation");
  await nav.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/About$/);
  await expect(page.getByRole("heading", { name: "About Us" })).toBeVisible();

  await nav.getByRole("link", { name: "Donate" }).click();
  await expect(page).toHaveURL(/\/Donate$/);
  await expect(page.getByRole("heading", { name: "Donate" })).toBeVisible();

  await nav.getByRole("link", { name: "Season" }).click();
  await expect(page).toHaveURL(/\/Season$/);
  await expect(page.getByRole("heading", { name: "Season 2025" })).toBeVisible();

  await nav.getByRole("link", { name: "Artists" }).click();
  await expect(page).toHaveURL(/\/Artists$/);
  await expect(page.getByRole("heading", { name: "Artists" })).toBeVisible();
});

test("mobile burger routes and closes after selection", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByLabel("Open menu").click();
  const burgerMenu = page.locator(".burgerNavBar");
  await expect(burgerMenu.getByRole("link", { name: "Home" })).toBeVisible();

  await burgerMenu.getByRole("link", { name: "Artists" }).click();

  await expect(page).toHaveURL(/\/Artists$/);
  await expect(page.locator(".burgerNavBar")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Artists" })).toBeVisible();
});
