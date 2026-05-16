const { expect } = require("@playwright/test");

function isAllowedBrowserUrl(url) {
  const parsed = new URL(url);

  if (["about:", "blob:", "data:"].includes(parsed.protocol)) {
    return true;
  }

  return ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname);
}

async function blockExternalRequests(page) {
  const blocked = [];

  await page.route("**/*", async (route) => {
    const url = route.request().url();

    if (isAllowedBrowserUrl(url)) {
      await route.continue();
      return;
    }

    blocked.push(url);
    await route.abort("blockedbyclient");
  });

  return blocked;
}

function expectNoExternalRequests(blocked) {
  expect(blocked).toEqual([]);
}

module.exports = {
  blockExternalRequests,
  expectNoExternalRequests,
};
