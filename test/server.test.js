const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const request = require("supertest");
const { createApp, getAdminUids, validateProposal } = require("../server");

function makeStaticRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "phantom-static-"));
  fs.writeFileSync(path.join(root, "index.html"), "<!doctype html><div id=\"root\"></div>");
  return root;
}

test("getAdminUids uses configured admins and local admins", () => {
  assert.deepEqual(
    getAdminUids({
      ADMIN_UIDS: "admin-1, admin-2",
      LOCAL_ADMIN_UIDS: "local-admin",
    }),
    ["admin-1", "admin-2", "local-admin"]
  );
});

test("validateProposal accepts and normalizes valid proposal data", () => {
  const result = validateProposal({
    artist: "  Artist\nName  ",
    email: "artist@example.com",
    phone: " 802-555-1212 ",
    description: "  New\nshow ",
  });

  assert.equal(result.error, undefined);
  assert.deepEqual(result.proposal, {
    artist: "Artist Name",
    email: "artist@example.com",
    phone: "802-555-1212",
    description: "New show",
  });
});

test("validateProposal rejects missing required fields", () => {
  const result = validateProposal({
    artist: "",
    email: "not-an-email",
    description: "",
  });

  assert.equal(result.error, "Artist and description are required.");
});

test("GET /whitelist returns configured admin IDs", async () => {
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
    .expect(200)
    .expect(["admin-1", "local-admin"]);
});

test("POST /send validates input before sending email", async () => {
  const calls = [];
  const app = createApp({
    staticRoot: makeStaticRoot(),
    env: {},
    transporter: {
      sendMail: async (message) => {
        calls.push(message);
        return { messageId: "msg-1" };
      },
    },
  });

  await request(app)
    .post("/send")
    .send({ artist: "", email: "bad", description: "" })
    .expect(400)
    .expect({ message: "Artist and description are required." });

  assert.equal(calls.length, 0);
});

test("POST /send sends sanitized proposal email", async () => {
  const calls = [];
  const app = createApp({
    staticRoot: makeStaticRoot(),
    env: {
      NODEMAILER_USER: "sender@example.com",
      NODEMAILER_RECIPIENT: "recipient@example.com",
    },
    transporter: {
      sendMail: async (message) => {
        calls.push(message);
        return { messageId: "msg-1" };
      },
    },
  });

  await request(app)
    .post("/send")
    .send({
      artist: "Example Artist",
      email: "artist@example.com",
      phone: "802-555-1212",
      description: "Example proposal",
    })
    .expect(200)
    .expect({ message: "message has been sent" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].from, "sender@example.com");
  assert.equal(calls[0].to, "recipient@example.com");
  assert.match(calls[0].text, /Artist Name: Example Artist/);
});

test("GET unknown route serves SPA fallback", async () => {
  const app = createApp({
    staticRoot: makeStaticRoot(),
    env: {},
    transporter: { sendMail: async () => ({ messageId: "unused" }) },
  });

  await request(app).get("/Season").expect(200).expect("Content-Type", /html/);
});
