# Review Findings Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the app and improve maintainability, reliability, security, and developer experience based on the code review findings.

**Architecture:** Make small, testable changes that preserve the existing Express + Vite React + Firebase shape. Server hardening stays in `server.js`; browser trust-boundary checks move into focused client utilities; Firebase authorization moves into rules and emulator tests; portal cleanup extracts shared helpers without redesigning the UI.

**Tech Stack:** Node.js, Express 5, Helmet, Vite, React 19, Vitest, React Testing Library, Firebase Auth/Firestore/Storage, Firebase Emulator Suite, GitHub Actions.

---

## Scope Check

The findings span server security, Firebase rules, client-side URL/file safety, portal maintainability, and CI. This plan keeps them in one sequence because each task is independently testable and commit-sized. If execution is split across workers, assign one task per worker and avoid overlapping edits to `AdminPortal.jsx` and `ArtistPortal.jsx`.

## File Structure

- `server.js`: Express middleware, CSP/security headers, legacy `/whitelist` response.
- `test/server.test.js`: Supertest coverage for removed public admin UID endpoint and security headers.
- `.env.example`: server env documentation after removing unused admin UID variables.
- `client/src/utils/safeUrl.js`: browser-safe external URL normalization.
- `client/src/__tests__/safeUrl.test.js`: unit coverage for URL normalization.
- `client/src/pages/home/Home.jsx`: use `safeTicketUrl` for ticket links.
- `client/src/pages/season/Season.jsx`: use `safeTicketUrl` for ticket links and guard hash scrolling.
- `client/src/pages/artists/Artists.jsx`: use `safeOptionalUrl` for public artist links.
- `client/src/utils/imageUpload.js`: shared image file checks and Firebase Storage upload helper.
- `client/src/__tests__/imageUpload.test.js`: unit coverage for upload helper behavior.
- `client/src/pages/artist_portal/ArtistPortal.jsx`: use shared upload helper and UI file constraints.
- `client/src/pages/admin_portal/AdminPortal.jsx`: use shared upload helper and UI file constraints.
- `client/src/pages/portals/portalTypes.js`: shared PropTypes and `nullShow`.
- `client/src/pages/portals/DateField.jsx`: shared admin date editor component.
- `firestore.rules`: strict schemas and tighter artist write permissions.
- `storage.rules`: reject SVG and non-approved image uploads.
- `client/scripts/seed-emulator.mjs`: seed a proposed show for authorization regression tests.
- `client/src/__tests__/firebaseRules.integration.test.js`: emulator-backed allow/deny tests for Firestore and Storage rules.
- `.nvmrc`: Node version pin for local and CI.
- `package.json`: Node engine declaration.
- `.github/workflows/ci.yml`: automated verification gates.
- `README.md`: document Node version and CI-equivalent local commands.

---

### Task 1: Remove Public Admin UID Exposure

**Files:**
- Modify: `test/server.test.js`
- Modify: `server.js`
- Modify: `.env.example`

- [ ] **Step 1: Write the failing endpoint test**

In `test/server.test.js`, remove `getAdminUids` from the destructured import and delete the two existing `getAdminUids` tests. Add this test where the old `/whitelist` route test currently lives:

```js
test("GET /whitelist does not expose admin identifiers", async () => {
  const app = createApp({
    staticRoot: makeStaticRoot(),
    env: {
      ADMIN_UIDS: "admin-1",
      LOCAL_ADMIN_UIDS: "local-admin",
    },
    transporter: { sendMail: async () => ({ messageId: "unused" }) },
  });

  await request(app)
    .get("/whitelist")
    .expect(404)
    .expect({ message: "not found" });
});
```

- [ ] **Step 2: Run the server test and verify it fails**

Run:

```bash
npm run test:server
```

Expected: FAIL because `GET /whitelist` currently returns `200` with the configured UID list.

- [ ] **Step 3: Remove UID parsing and return a safe legacy response**

In `server.js`, delete these declarations:

```js
const DEFAULT_ADMIN_UIDS = [];

function parseList(value) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function getAdminUids(env = process.env) {
  const configured = parseList(env.ADMIN_UIDS);
  const local = parseList(env.LOCAL_ADMIN_UIDS);
  return configured.concat(local);
}
```

Replace the existing `/whitelist` route with this explicit legacy denial:

```js
  app.get("/whitelist", (req, res) => {
    res.status(404).json({ message: "not found" });
  });
```

Update the `module.exports` block to remove `DEFAULT_ADMIN_UIDS` and `getAdminUids`:

```js
module.exports = {
  createApp,
  createTransporter,
  startServer,
  validateProposal,
};
```

In `.env.example`, remove these lines:

```text
ADMIN_UIDS=
LOCAL_ADMIN_UIDS=local-admin-uid
```

- [ ] **Step 4: Run the server tests and verify the behavior passes**

Run:

```bash
npm run test:server
```

Expected: PASS with all server tests green.

- [ ] **Step 5: Commit**

```bash
git add server.js test/server.test.js .env.example
git commit -m "fix: stop exposing admin identifiers"
```

---

### Task 2: Enable Express Security Headers and CSP

**Files:**
- Modify: `test/server.test.js`
- Modify: `server.js`

- [ ] **Step 1: Write the failing security header test**

Add this test after the SPA fallback test in `test/server.test.js`:

```js
test("GET / serves production security headers", async () => {
  const app = createApp({
    staticRoot: makeStaticRoot(),
    env: {},
    transporter: { sendMail: async () => ({ messageId: "unused" }) },
  });

  const response = await request(app).get("/").expect(200);
  const csp = response.headers["content-security-policy"];

  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.equal(response.headers["x-frame-options"], "DENY");
  assert.equal(response.headers["x-content-type-options"], "nosniff");
});
```

- [ ] **Step 2: Run the server test and verify it fails**

Run:

```bash
npm run test:server
```

Expected: FAIL because `content-security-policy` is missing while Helmet CSP is disabled.

- [ ] **Step 3: Add explicit Helmet options**

In `server.js`, add this function above `createApp`:

```js
function createHelmetOptions() {
  return {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: [
          "'self'",
          "https://*.googleapis.com",
          "https://*.firebaseio.com",
          "https://firebasestorage.googleapis.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
        ],
        fontSrc: ["'self'", "data:"],
        formAction: ["'self'", "https://www.paypal.com"],
        frameSrc: ["'self'", "https://www.paypal.com"],
        frameAncestors: ["'none'"],
      },
    },
    frameguard: {
      action: "deny",
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  };
}
```

Replace the current Helmet call:

```js
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
```

with:

```js
  app.use(helmet(createHelmetOptions()));
```

Update exports so tests and future audits can inspect the config if needed:

```js
module.exports = {
  createApp,
  createHelmetOptions,
  createTransporter,
  startServer,
  validateProposal,
};
```

- [ ] **Step 4: Run server tests and build**

Run:

```bash
npm run test:server
npm --prefix client run build
```

Expected: both commands PASS. The build may still print the existing large chunk warning.

- [ ] **Step 5: Commit**

```bash
git add server.js test/server.test.js
git commit -m "feat: enable express security headers"
```

---

### Task 3: Normalize Firestore-Backed Public URLs

**Files:**
- Create: `client/src/utils/safeUrl.js`
- Create: `client/src/__tests__/safeUrl.test.js`
- Modify: `client/src/pages/home/Home.jsx`
- Modify: `client/src/pages/season/Season.jsx`
- Modify: `client/src/pages/artists/Artists.jsx`
- Modify: `client/src/__tests__/publicPages.test.jsx`

- [ ] **Step 1: Write failing URL utility tests**

Create `client/src/__tests__/safeUrl.test.js`:

```js
import { describe, expect, test } from "vitest";
import {
  FALLBACK_TICKET_URL,
  safeExternalUrl,
  safeOptionalUrl,
  safeTicketUrl,
} from "../utils/safeUrl";

describe("safeUrl", () => {
  test("allows absolute https URLs", () => {
    expect(safeExternalUrl("https://tickets.example.com/show")).toBe(
      "https://tickets.example.com/show"
    );
  });

  test("rejects javascript, data, relative, protocol-relative, and http URLs", () => {
    expect(safeTicketUrl("javascript:alert(1)")).toBe(FALLBACK_TICKET_URL);
    expect(safeTicketUrl("data:text/html,<script>alert(1)</script>")).toBe(
      FALLBACK_TICKET_URL
    );
    expect(safeTicketUrl("/local/path")).toBe(FALLBACK_TICKET_URL);
    expect(safeTicketUrl("//evil.example.com/path")).toBe(FALLBACK_TICKET_URL);
    expect(safeTicketUrl("http://tickets.example.com/show")).toBe(FALLBACK_TICKET_URL);
  });

  test("trims safe URLs and returns empty string for absent optional URLs", () => {
    expect(safeOptionalUrl("  https://artist.example.com/bio  ")).toBe(
      "https://artist.example.com/bio"
    );
    expect(safeOptionalUrl("")).toBe("");
    expect(safeOptionalUrl(undefined)).toBe("");
  });

  test("supports exact host allowlists", () => {
    const allowedHosts = new Set(["paypal.com", "www.paypal.com"]);

    expect(
      safeExternalUrl("https://www.paypal.com/donate", "", { allowedHosts })
    ).toBe("https://www.paypal.com/donate");
    expect(
      safeExternalUrl("https://paypal.attacker.example/donate", "", { allowedHosts })
    ).toBe("");
  });
});
```

- [ ] **Step 2: Run the utility test and verify it fails**

Run:

```bash
npm --prefix client test -- src/__tests__/safeUrl.test.js
```

Expected: FAIL because `client/src/utils/safeUrl.js` does not exist.

- [ ] **Step 3: Implement the URL helper**

Create `client/src/utils/safeUrl.js`:

```js
export const FALLBACK_TICKET_URL = "https://theaterengine.com/companies/1";

const DEFAULT_ALLOWED_PROTOCOLS = new Set(["https:"]);
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

export function safeExternalUrl(value, fallback = "", options = {}) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.startsWith("//") || CONTROL_CHARACTERS.test(trimmed)) {
    return fallback;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return fallback;
  }

  const allowedProtocols = options.allowedProtocols || DEFAULT_ALLOWED_PROTOCOLS;
  if (!allowedProtocols.has(parsed.protocol)) {
    return fallback;
  }

  if (options.allowedHosts) {
    const host = parsed.hostname.toLowerCase();
    if (!options.allowedHosts.has(host)) {
      return fallback;
    }
  }

  return parsed.href;
}

export function safeTicketUrl(value) {
  return safeExternalUrl(value, FALLBACK_TICKET_URL);
}

export function safeOptionalUrl(value) {
  return safeExternalUrl(value, "");
}
```

- [ ] **Step 4: Verify the helper passes**

Run:

```bash
npm --prefix client test -- src/__tests__/safeUrl.test.js
```

Expected: PASS.

- [ ] **Step 5: Add failing page-level tests for malicious URLs**

In `client/src/__tests__/publicPages.test.jsx`, add this test inside `describe("public pages", () => { ... })` after the existing home fallback ticket test:

```jsx
  test("home replaces unsafe ticket links with the ticket fallback", async () => {
    firestore.docsByCollection.shows = [
      doc("unsafe-ticket-show", {
        title: "Unsafe Ticket Show",
        dates: [{ date: "2099-06-01T19:30", ticketLink: "javascript:alert(1)" }],
        imageLg: "/unsafe.jpg",
      }),
    ];

    renderWithRouter(<Home />);

    expect(await screen.findByRole("heading", { name: "Unsafe Ticket Show" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buy tickets/i })).toHaveAttribute(
      "href",
      "https://theaterengine.com/companies/1"
    );
  });
```

Add this test after the existing artist profile link tests:

```jsx
  test("artists page hides unsafe social URLs from Firestore", async () => {
    firestore.docsByCollection.artists = [
      doc("artist-with-unsafe-links", {
        artist: "Unsafe Link Artist",
        bio: "Bio",
        email: "artist@example.com",
        picUrl: "/artist.jpg",
        web: "javascript:alert(1)",
        fb: "data:text/html,<script>alert(1)</script>",
        youtube: "http://youtube.example.com/channel",
        insta: "//instagram.example.com/artist",
        spotify: "https://open.spotify.com/artist/example",
      }),
    ];

    render(<ArtistsList />);

    expect(await screen.findByRole("heading", { name: "Unsafe Link Artist" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Website" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Facebook" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "YouTube" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Instagram" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spotify" })).toHaveAttribute(
      "href",
      "https://open.spotify.com/artist/example"
    );
  });
```

- [ ] **Step 6: Run page tests and verify they fail**

Run:

```bash
npm --prefix client test -- src/__tests__/publicPages.test.jsx
```

Expected: FAIL because page components still render unsafe Firestore URLs directly.

- [ ] **Step 7: Use safe URLs in public pages**

In `client/src/pages/home/Home.jsx`, add this import:

```js
import { safeTicketUrl } from "../../utils/safeUrl";
```

Replace both ticket `href` expressions with:

```jsx
href={safeTicketUrl(date.ticketLink)}
```

In `client/src/pages/season/Season.jsx`, add this import:

```js
import { safeTicketUrl } from "../../utils/safeUrl";
```

Replace the ticket `href` expression with:

```jsx
href={safeTicketUrl(date.ticketLink)}
```

Also replace the hash scroll block:

```js
        if (location.hash) {
          setTimeout(() => {
            console.log("scrolling to " + location.hash.slice(1));
            document.getElementById(location.hash.slice(1)).scrollIntoView();

            //window.scroll({top: location.hash, behavior: "smooth"})
          }, 1500);
        }
```

with:

```js
        if (location.hash) {
          setTimeout(() => {
            const target = document.getElementById(location.hash.slice(1));
            target?.scrollIntoView();
          }, 1500);
        }
```

In `client/src/pages/artists/Artists.jsx`, add this import:

```js
import { safeOptionalUrl } from "../../utils/safeUrl";
```

Replace the start of the `allArtists.map` callback with:

```jsx
          {allArtists.map((artist, i) => {
            const website = safeOptionalUrl(artist.website || artist.web);
            const facebook = safeOptionalUrl(artist.facebook || artist.fb);
            const instagram = safeOptionalUrl(artist.instagram || artist.insta);
            const youtube = safeOptionalUrl(artist.youtube);
            const spotify = safeOptionalUrl(artist.spotify);
            return (
```

Then replace `href={artist.youtube}` with:

```jsx
href={youtube}
```

Replace `href={artist.spotify}` with:

```jsx
href={spotify}
```

Replace the conditional checks for YouTube and Spotify with:

```jsx
{youtube ? (
```

and:

```jsx
{spotify ? (
```

- [ ] **Step 8: Run URL-related tests and lint**

Run:

```bash
npm --prefix client test -- src/__tests__/safeUrl.test.js src/__tests__/publicPages.test.jsx
npm --prefix client run lint
```

Expected: both commands PASS.

- [ ] **Step 9: Commit**

```bash
git add client/src/utils/safeUrl.js client/src/__tests__/safeUrl.test.js client/src/__tests__/publicPages.test.jsx client/src/pages/home/Home.jsx client/src/pages/season/Season.jsx client/src/pages/artists/Artists.jsx
git commit -m "fix: normalize external URLs from Firestore"
```

---

### Task 4: Centralize Image Upload Checks and Portal Upload Behavior

**Files:**
- Create: `client/src/utils/imageUpload.js`
- Create: `client/src/__tests__/imageUpload.test.js`
- Modify: `client/src/pages/artist_portal/ArtistPortal.jsx`
- Modify: `client/src/pages/admin_portal/AdminPortal.jsx`
- Modify: `client/src/__tests__/portalFlows.test.jsx`

- [ ] **Step 1: Write failing upload helper tests**

Create `client/src/__tests__/imageUpload.test.js`:

```js
import { beforeEach, describe, expect, test, vi } from "vitest";

const storageApi = vi.hoisted(() => ({
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock("firebase/storage", () => ({
  getDownloadURL: storageApi.getDownloadURL,
  ref: storageApi.ref,
  uploadBytes: storageApi.uploadBytes,
}));

describe("imageUpload", () => {
  beforeEach(() => {
    storageApi.getDownloadURL.mockReset();
    storageApi.ref.mockReset();
    storageApi.uploadBytes.mockReset();
    storageApi.ref.mockImplementation((storage, name) => ({ storage, name }));
    storageApi.uploadBytes.mockResolvedValue({ ref: { name: "uploaded" } });
    storageApi.getDownloadURL.mockResolvedValue("https://storage.example.com/image.jpg");
  });

  test("rejects missing files, SVG files, and oversized images", async () => {
    const { MAX_IMAGE_BYTES, assertImageFile } = await import("../utils/imageUpload");

    expect(() => assertImageFile(undefined)).toThrow("Choose an image before uploading.");
    expect(() =>
      assertImageFile(new File(["<svg></svg>"], "bad.svg", { type: "image/svg+xml" }))
    ).toThrow("Use a JPEG, PNG, WebP, or GIF image.");
    expect(() =>
      assertImageFile(
        new File([new Uint8Array(MAX_IMAGE_BYTES)], "large.jpg", { type: "image/jpeg" })
      )
    ).toThrow("Use an image smaller than 5 MB.");
  });

  test("uploads approved images under the signed-in user prefix", async () => {
    const { uploadUserImage } = await import("../utils/imageUpload");
    const file = new File(["image"], "Profile Photo!.jpg", { type: "image/jpeg" });

    const url = await uploadUserImage({
      storage: { name: "storage" },
      uid: "artist-uid",
      file,
    });

    expect(url).toBe("https://storage.example.com/image.jpg");
    expect(storageApi.ref).toHaveBeenCalledWith(
      { name: "storage" },
      expect.stringMatching(/^uploads\/artist-uid\/.+-Profile_Photo_.jpg$/)
    );
    expect(storageApi.uploadBytes).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.stringContaining("uploads/artist-uid/") }),
      file
    );
  });

  test("requires an authenticated uid before uploading", async () => {
    const { uploadUserImage } = await import("../utils/imageUpload");
    const file = new File(["image"], "profile.jpg", { type: "image/jpeg" });

    await expect(
      uploadUserImage({
        storage: { name: "storage" },
        uid: "",
        file,
      })
    ).rejects.toThrow("Sign in before uploading images.");
  });
});
```

- [ ] **Step 2: Run upload helper tests and verify they fail**

Run:

```bash
npm --prefix client test -- src/__tests__/imageUpload.test.js
```

Expected: FAIL because `client/src/utils/imageUpload.js` does not exist.

- [ ] **Step 3: Implement the shared image upload helper**

Create `client/src/utils/imageUpload.js`:

```js
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function safeFileName(name) {
  const cleaned = typeof name === "string" ? name.replace(/[^a-zA-Z0-9._-]/g, "_") : "";
  return cleaned || "upload";
}

export function assertImageFile(file) {
  if (!file) {
    throw new Error("Choose an image before uploading.");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Use a JPEG, PNG, WebP, or GIF image.");
  }

  if (file.size >= MAX_IMAGE_BYTES) {
    throw new Error("Use an image smaller than 5 MB.");
  }

  return file;
}

export function imageRefForUser(storage, uid, file) {
  if (!uid) {
    throw new Error("Sign in before uploading images.");
  }

  const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
  return ref(storage, `uploads/${uid}/${uniqueId}-${safeFileName(file.name)}`);
}

export async function uploadUserImage({ storage, uid, file }) {
  const image = assertImageFile(file);
  const imageRef = imageRefForUser(storage, uid, image);
  const imageUpload = await uploadBytes(imageRef, image);
  return getDownloadURL(imageUpload.ref);
}
```

- [ ] **Step 4: Verify upload helper tests pass**

Run:

```bash
npm --prefix client test -- src/__tests__/imageUpload.test.js
```

Expected: PASS.

- [ ] **Step 5: Add failing portal UI assertions**

In `client/src/__tests__/portalFlows.test.jsx`, inside the `"artist portal uploads proposal images and creates a show proposal"` test, immediately after opening the proposal form, add:

```jsx
    expect(container.querySelector('input[name="splash-img"]')).toHaveAttribute("accept", "image/*");
    expect(
      screen.getAllByRole("button", { name: /Upload your image to the Database/i })[0]
    ).toBeDisabled();
```

In the `"admin portal manages shows, artist profiles, and donors"` test, immediately after the admin show editor is visible, add:

```jsx
    expect(container.querySelector('input[name="splash-img"]')).toHaveAttribute("accept", "image/*");
    expect(
      screen.getAllByRole("button", { name: /Upload image to the Database/i })[0]
    ).toBeDisabled();
```

- [ ] **Step 6: Run portal tests and verify they fail**

Run:

```bash
npm --prefix client test -- src/__tests__/portalFlows.test.jsx
```

Expected: FAIL because upload inputs lack `accept="image/*"` and upload buttons are enabled with no selected file.

- [ ] **Step 7: Use the helper in `ArtistPortal.jsx`**

In `client/src/pages/artist_portal/ArtistPortal.jsx`, replace:

```js
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
```

with:

```js
import { uploadUserImage } from "../../utils/imageUpload";
```

Delete the local `imageRefForUser` function.

Replace the show image uploader function with:

```js
  const imgUploader = async (img, targetProp) => {
    try {
      const imgUrl = await uploadUserImage({
        storage,
        uid: auth.currentUser?.uid,
        file: img,
      });

      switch (targetProp) {
        case "splash":
          setImgLgUrl(imgUrl);
          break;
        case "2":
          setImg2Url(imgUrl);
          break;
        case "3":
          setImg3Url(imgUrl);
          break;
      }
      alert("Image uploaded to Database");
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };
```

Replace the profile image uploader function with:

```js
  const imgUploader = async (img) => {
    try {
      const imgUrl = await uploadUserImage({
        storage,
        uid: auth.currentUser?.uid,
        file: img,
      });

      setPicUrl(imgUrl);
      alert("Image uploaded to Database");
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };
```

For every file input in `ArtistPortal.jsx`, add:

```jsx
accept="image/*"
```

For the show image upload buttons, add the matching disabled props:

```jsx
disabled={!imageLg}
```

```jsx
disabled={!image2}
```

```jsx
disabled={!image3}
```

For the profile image upload button, add:

```jsx
disabled={!artistPic}
```

- [ ] **Step 8: Use the helper in `AdminPortal.jsx`**

In `client/src/pages/admin_portal/AdminPortal.jsx`, replace:

```js
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
```

with:

```js
import { uploadUserImage } from "../../utils/imageUpload";
```

Delete the local `imageRefForUser` function.

Replace the show image uploader function with:

```js
  const imgUploader = async (img, targetProp) => {
    try {
      const imgUrl = await uploadUserImage({
        storage,
        uid: auth.currentUser?.uid,
        file: img,
      });

      switch (targetProp) {
        case "splash":
          setImgLgUrl(imgUrl);
          break;
        case "2":
          setImg2Url(imgUrl);
          break;
        case "3":
          setImg3Url(imgUrl);
          break;
      }
      alert("Image uploaded to the Database");
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };
```

Replace the profile image uploader function with:

```js
  const imgUploader = async (img) => {
    try {
      const imgUrl = await uploadUserImage({
        storage,
        uid: auth.currentUser?.uid,
        file: img,
      });

      setPicUrl(imgUrl);
      alert("Image uploaded to Database");
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };
```

For every file input in `AdminPortal.jsx`, add:

```jsx
accept="image/*"
```

For the show image upload buttons, add:

```jsx
disabled={!imageLg}
```

```jsx
disabled={!image2}
```

```jsx
disabled={!image3}
```

For the profile image upload button, add:

```jsx
disabled={!artistPic}
```

- [ ] **Step 9: Run upload and portal tests**

Run:

```bash
npm --prefix client test -- src/__tests__/imageUpload.test.js src/__tests__/portalFlows.test.jsx
npm --prefix client run lint
```

Expected: both commands PASS.

- [ ] **Step 10: Commit**

```bash
git add client/src/utils/imageUpload.js client/src/__tests__/imageUpload.test.js client/src/__tests__/portalFlows.test.jsx client/src/pages/artist_portal/ArtistPortal.jsx client/src/pages/admin_portal/AdminPortal.jsx
git commit -m "fix: centralize safe image uploads"
```

---

### Task 5: Tighten Firebase Rules with Emulator Regression Tests

**Files:**
- Create: `client/src/__tests__/firebaseRules.integration.test.js`
- Modify: `client/scripts/seed-emulator.mjs`
- Modify: `firestore.rules`
- Modify: `storage.rules`

- [ ] **Step 1: Seed a proposed show for deny tests**

In `client/scripts/seed-emulator.mjs`, add this block after the existing `shows/seed-show` write:

```js
await db.doc("shows/seed-proposed-show").set({
  title: "Seeded Proposed Show",
  type: "theater",
  blurb: "A seeded proposed show for local authorization testing.",
  status: "proposed",
  dates: [
    {
      date: "2099-07-01T19:30",
      ticketLink: "https://theaterengine.com/companies/1",
      soldOut: false,
    },
  ],
  artists: [artist.uid],
  contactName: "Example Producer",
  description: "Internal seeded proposed show description.",
  imageLg: "https://placehold.co/1200x800",
  image2: "",
  image3: "",
});
```

- [ ] **Step 2: Write failing emulator authorization tests**

Create `client/src/__tests__/firebaseRules.integration.test.js`:

```js
import { describe, expect, test } from "vitest";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../config/firebase";

const describeRules =
  globalThis.process?.env?.RUN_FIREBASE_EMULATOR_TESTS === "true"
    ? describe
    : describe.skip;

const TEST_TIMEOUT = 15000;

async function signInAs(email) {
  await signOut(auth).catch(() => {});
  const credential = await signInWithEmailAndPassword(auth, email, "password123");
  return credential.user;
}

async function expectPermissionDenied(promise) {
  await expect(promise).rejects.toMatchObject({ code: "permission-denied" });
}

async function expectStorageUnauthorized(promise) {
  await expect(promise).rejects.toMatchObject({ code: "storage/unauthorized" });
}

function validShow(overrides = {}) {
  return {
    title: "Admin Created Show",
    type: "theater",
    blurb: "Public show blurb.",
    status: "proposed",
    dates: [
      {
        date: "2099-08-01T19:30",
        ticketLink: "https://theaterengine.com/companies/1",
        soldOut: false,
      },
    ],
    artists: ["artist-for-admin-created-show"],
    contactName: "Admin Producer",
    description: "Internal show notes.",
    imageLg: "https://placehold.co/1200x800",
    image2: "",
    image3: "",
    ...overrides,
  };
}

describeRules("Firebase security rules", () => {
  test(
    "artists cannot archive their own proposed shows",
    async () => {
      await signInAs("artist@example.com");

      await expectPermissionDenied(
        updateDoc(doc(db, "shows", "seed-proposed-show"), {
          status: "archived",
        })
      );
    },
    TEST_TIMEOUT
  );

  test(
    "artists cannot write unexpected profile fields",
    async () => {
      const artist = await signInAs("artist@example.com");

      await expectPermissionDenied(
        updateDoc(doc(db, "artists", artist.uid), {
          privateNote: "not allowed",
        })
      );
    },
    TEST_TIMEOUT
  );

  test(
    "admins can create and book shows",
    async () => {
      await signInAs("admin@example.com");
      const showRef = doc(db, "shows", "admin-created-rules-show");

      await setDoc(showRef, validShow());
      await updateDoc(showRef, { status: "booked" });

      const snapshot = await getDoc(showRef);
      expect(snapshot.data().status).toBe("booked");
    },
    TEST_TIMEOUT
  );

  test(
    "storage rejects SVG uploads even when the user owns the path",
    async () => {
      const artist = await signInAs("artist@example.com");
      const svg = new Blob(["<svg><script>alert(1)</script></svg>"], {
        type: "image/svg+xml",
      });

      await expectStorageUnauthorized(
        uploadBytes(ref(storage, `uploads/${artist.uid}/bad.svg`), svg)
      );
    },
    TEST_TIMEOUT
  );
});
```

- [ ] **Step 3: Run emulator tests and verify the new deny tests fail**

Run:

```bash
npm run test:emulators
```

Expected: FAIL because the current rules allow artists to archive proposed shows, allow unexpected artist profile fields, and allow `image/svg+xml` uploads.

- [ ] **Step 4: Replace Firestore rules with strict schemas**

Replace `firestore.rules` with:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    function ownsArtistProfile(artistId) {
      return signedIn() && request.auth.uid == artistId;
    }

    function isShowArtist(show) {
      return signedIn() && show.artists is list && request.auth.uid in show.artists;
    }

    function hasKey(data, key) {
      return data.keys().hasAll([key]);
    }

    function optionalString(data, key, maxLength) {
      return !hasKey(data, key) || (data[key] is string && data[key].size() <= maxLength);
    }

    function optionalUrl(data, key) {
      return !hasKey(data, key) || (
        data[key] is string &&
        data[key].size() <= 2048 &&
        (data[key] == "" || data[key].matches('https://.*'))
      );
    }

    function validArtistProfile(data) {
      return data.keys().hasOnly([
          "artist",
          "contact",
          "phone",
          "email",
          "bio",
          "web",
          "website",
          "fb",
          "facebook",
          "youtube",
          "insta",
          "instagram",
          "spotify",
          "picUrl"
        ]) &&
        optionalString(data, "artist", 120) &&
        optionalString(data, "contact", 120) &&
        optionalString(data, "phone", 40) &&
        optionalString(data, "email", 254) &&
        optionalString(data, "bio", 4000) &&
        optionalUrl(data, "web") &&
        optionalUrl(data, "website") &&
        optionalUrl(data, "fb") &&
        optionalUrl(data, "facebook") &&
        optionalUrl(data, "youtube") &&
        optionalUrl(data, "insta") &&
        optionalUrl(data, "instagram") &&
        optionalUrl(data, "spotify") &&
        optionalUrl(data, "picUrl");
    }

    function validShow(data) {
      return data.keys().hasOnly([
          "title",
          "type",
          "blurb",
          "status",
          "dates",
          "artists",
          "contactName",
          "description",
          "imageLg",
          "image2",
          "image3"
        ]) &&
        data.title is string &&
        data.title.size() > 0 &&
        data.title.size() <= 160 &&
        optionalString(data, "type", 80) &&
        optionalString(data, "blurb", 4000) &&
        optionalString(data, "contactName", 160) &&
        optionalString(data, "description", 8000) &&
        data.status in ["proposed", "booked", "archived"] &&
        data.artists is list &&
        data.artists.size() > 0 &&
        data.artists.size() <= 20 &&
        data.dates is list &&
        data.dates.size() <= 50 &&
        optionalUrl(data, "imageLg") &&
        optionalUrl(data, "image2") &&
        optionalUrl(data, "image3");
    }

    function validDonor(data) {
      return data.keys().hasOnly(["name", "id"]) &&
        data.name is string &&
        data.name.size() > 0 &&
        data.name.size() <= 160 &&
        optionalString(data, "id", 160);
    }

    match /admins/{adminId} {
      allow read: if ownsArtistProfile(adminId) || isAdmin();
      allow write: if isAdmin();
    }

    match /artists/{artistId} {
      allow read: if true;
      allow create, update: if (ownsArtistProfile(artistId) || isAdmin()) &&
        validArtistProfile(request.resource.data);
      allow delete: if isAdmin();
    }

    match /shows/{showId} {
      allow read: if resource.data.status == "booked" || isShowArtist(resource.data) || isAdmin();
      allow create: if validShow(request.resource.data) && (
        isAdmin() || (
          isShowArtist(request.resource.data) &&
          request.resource.data.status == "proposed"
        )
      );
      allow update: if validShow(request.resource.data) && (
        isAdmin() || (
          isShowArtist(resource.data) &&
          isShowArtist(request.resource.data) &&
          resource.data.status == "proposed" &&
          request.resource.data.status == "proposed"
        )
      );
      allow delete: if isAdmin();
    }

    match /donors/{donorId} {
      allow read: if true;
      allow create, update: if isAdmin() && validDonor(request.resource.data);
      allow delete: if isAdmin();
    }
  }
}
```

- [ ] **Step 5: Replace Storage rules with approved raster image types**

Replace `storage.rules` with:

```text
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function signedIn() {
      return request.auth != null;
    }

    function isApprovedImageUpload() {
      return request.resource != null &&
        request.resource.size < 5 * 1024 * 1024 &&
        request.resource.contentType in [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif'
        ];
    }

    match /uploads/{userId}/{fileName} {
      allow read: if true;
      allow write: if signedIn() && request.auth.uid == userId && isApprovedImageUpload();
    }

    match /{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

- [ ] **Step 6: Run emulator authorization tests**

Run:

```bash
npm run test:emulators
```

Expected: PASS for the Firebase emulator smoke test and the new Firebase security rules tests.

- [ ] **Step 7: Commit**

```bash
git add firestore.rules storage.rules client/scripts/seed-emulator.mjs client/src/__tests__/firebaseRules.integration.test.js
git commit -m "fix: tighten firebase authorization rules"
```

---

### Task 6: Extract Shared Portal Types and Date Field

**Files:**
- Create: `client/src/pages/portals/portalTypes.js`
- Create: `client/src/pages/portals/DateField.jsx`
- Modify: `client/src/pages/admin_portal/AdminPortal.jsx`
- Modify: `client/src/pages/artist_portal/ArtistPortal.jsx`

- [ ] **Step 1: Create shared portal types**

Create `client/src/pages/portals/portalTypes.js`:

```js
import PropTypes from "prop-types";

export const nullShow = {
  title: "title",
  type: "type",
  blurb: "blurb",
  status: "proposed",
  dates: [],
  artists: [],
  contactName: "contactName",
  phone: "phone",
  email: "email",
  bio: "bio",
  description: "description",
  imageLg: "",
  imageLgName: "",
  image2: "",
  image2Name: "",
  image3: "",
  image3Name: "",
};

export const showDatePropType = PropTypes.shape({
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ticketLink: PropTypes.string,
  soldOut: PropTypes.bool,
});

export const showPropType = PropTypes.shape({
  id: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
  status: PropTypes.string,
  description: PropTypes.string,
  contactName: PropTypes.string,
  artists: PropTypes.arrayOf(PropTypes.string),
  dates: PropTypes.arrayOf(showDatePropType),
  blurb: PropTypes.string,
  imageLg: PropTypes.string,
  image2: PropTypes.string,
  image3: PropTypes.string,
});

export const artistProfilePropType = PropTypes.shape({
  id: PropTypes.string,
  artist: PropTypes.string,
  phone: PropTypes.string,
  email: PropTypes.string,
  bio: PropTypes.string,
  web: PropTypes.string,
  fb: PropTypes.string,
  youtube: PropTypes.string,
  insta: PropTypes.string,
  spotify: PropTypes.string,
  picUrl: PropTypes.string,
});
```

- [ ] **Step 2: Extract admin date field component**

Create `client/src/pages/portals/DateField.jsx`:

```jsx
import { useState } from "react";
import PropTypes from "prop-types";
import { showDatePropType } from "./portalTypes";

export function DateField({ date, allDates, index, update }) {
  const [dateTime, setDateTime] = useState(date.date || "");
  const [ticketLink, setTicketLink] = useState(date.ticketLink || "");
  const [soldOut, setSoldOut] = useState(date.soldOut || false);

  return (
    <div className="date-time-field">
      <label htmlFor="date-time">Choose a showtime</label>
      <input
        type="datetime-local"
        name="date-time"
        value={dateTime}
        onChange={(evt) => {
          setDateTime(evt.target.value);
        }}
      />
      <label htmlFor="ticket-link">Link to tickets for this show time</label>
      <input
        name="ticket-link"
        type="text"
        value={ticketLink}
        placeholder="Ticket Link"
        onChange={(evt) => {
          setTicketLink(evt.target.value);
        }}
      />
      <label htmlFor="sold-out">Show is Sold out</label>
      <input
        name="sold-out"
        type="checkbox"
        checked={soldOut}
        onChange={(evt) => {
          setSoldOut(evt.target.checked);
        }}
      />
      <button
        className="submit highlight"
        onClick={(evt) => {
          evt.preventDefault();
          const upDate = allDates.toSpliced(index, 1, {
            date: dateTime,
            ticketLink,
            soldOut,
          });
          update(upDate);
        }}
      >
        Confirm Show Time
      </button>
    </div>
  );
}

DateField.propTypes = {
  date: showDatePropType.isRequired,
  allDates: PropTypes.arrayOf(showDatePropType).isRequired,
  index: PropTypes.number.isRequired,
  update: PropTypes.func.isRequired,
};
```

- [ ] **Step 3: Use shared types in `ArtistPortal.jsx`**

In `client/src/pages/artist_portal/ArtistPortal.jsx`, delete the local `nullShow`, `showDatePropType`, and `showPropType` declarations. Keep the existing `PropTypes` import because `LoginPortal` and `ArtistProfile` still use it.

Add this import:

```js
import { nullShow, showPropType } from "../portals/portalTypes";
```

- [ ] **Step 4: Use shared types and `DateField` in `AdminPortal.jsx`**

In `client/src/pages/admin_portal/AdminPortal.jsx`, delete the local `showDatePropType`, `showPropType`, `artistProfilePropType`, and `DateField` declarations.

Add these imports:

```js
import { DateField } from "../portals/DateField";
import { artistProfilePropType, showPropType } from "../portals/portalTypes";
```

- [ ] **Step 5: Run portal tests and lint**

Run:

```bash
npm --prefix client test -- src/__tests__/portalFlows.test.jsx
npm --prefix client run lint
```

Expected: both commands PASS. `AdminPortal.jsx` and `ArtistPortal.jsx` line counts should drop without changing user-visible behavior.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/portals/portalTypes.js client/src/pages/portals/DateField.jsx client/src/pages/admin_portal/AdminPortal.jsx client/src/pages/artist_portal/ArtistPortal.jsx
git commit -m "refactor: extract shared portal helpers"
```

---

### Task 7: Add CI and Runtime Version Pinning

**Files:**
- Create: `.nvmrc`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Add Node version pin**

Create `.nvmrc`:

```text
22
```

In root `package.json`, add this block after `"license": "ISC",`:

```json
  "engines": {
    "node": ">=22.12.0 <25",
    "npm": ">=10"
  },
```

- [ ] **Step 2: Add CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: |
            package-lock.json
            client/package-lock.json

      - name: Install server dependencies
        run: npm ci

      - name: Install client dependencies
        run: npm ci --prefix client

      - name: Run server and client tests
        run: npm test

      - name: Run client lint
        run: npm --prefix client run lint

      - name: Build client
        run: npm --prefix client run build

      - name: Audit server dependencies
        run: npm audit --audit-level=high

      - name: Audit client dependencies
        run: npm audit --prefix client --audit-level=high

      - name: Run Firebase emulator tests
        run: npm run test:emulators
```

- [ ] **Step 3: Document local CI parity**

In `README.md`, add this section after the install commands:

````markdown
Use Node 22 for local development:

```sh
nvm use
```
````

In the `Quality gates` command block, add:

```sh
npm run test:emulators
```

- [ ] **Step 4: Run CI-equivalent local commands**

Run:

```bash
npm test
npm --prefix client run lint
npm --prefix client run build
npm audit --audit-level=high
npm audit --prefix client --audit-level=high
```

Expected: all commands PASS. The client audit may still report low-severity transitive findings while exiting `0` because the gate is `--audit-level=high`.

Run this when Firebase emulator ports are free:

```bash
npm run test:emulators
```

Expected: PASS for emulator smoke and rules tests.

- [ ] **Step 5: Commit**

```bash
git add .nvmrc .github/workflows/ci.yml package.json README.md
git commit -m "ci: add verification workflow"
```

---

## Final Verification

After all task commits are complete, run:

```bash
npm test
npm --prefix client run lint
npm --prefix client run build
npm audit --audit-level=high
npm audit --prefix client --audit-level=high
npm run test:emulators
git status --short
```

Expected:

```text
npm test: all server and client tests pass, with the emulator-only suite skipped in the non-emulator run.
client lint: exits 0.
client build: exits 0; an existing chunk-size warning is acceptable.
root audit: exits 0.
client audit: exits 0 for high-severity gate.
test:emulators: exits 0 and includes Firebase rules tests.
git status --short: clean after the final commit.
```

## Plan Self-Review

- Spec coverage: Task 1 removes public admin UID exposure; Task 2 enables CSP/security headers; Task 3 normalizes Firestore-backed URLs; Task 4 centralizes file upload checks; Task 5 tightens Firebase rules; Task 6 reduces portal duplication; Task 7 adds CI and runtime pinning.
- Placeholder scan: this plan contains concrete file paths, code snippets, commands, and expected results for each task.
- Type consistency: helper names used by later tasks are defined before use: `safeTicketUrl`, `safeOptionalUrl`, `uploadUserImage`, `nullShow`, `showPropType`, `artistProfilePropType`, and `DateField`.
