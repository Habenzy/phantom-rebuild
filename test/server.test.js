const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const nodemailer = require("nodemailer");
const request = require("supertest");
const {
  createApp,
  createTransporter,
  startServer,
  validateProposal,
} = require("../server");

function makeStaticRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "phantom-static-"));
  fs.writeFileSync(path.join(root, "index.html"), "<!doctype html><div id=\"root\"></div>");
  return root;
}

function waitForListening(server) {
  return new Promise((resolve) => {
    const resolveAfterListenCallback = () => setImmediate(resolve);

    if (server.listening) {
      resolveAfterListenCallback();
      return;
    }

    server.once("listening", resolveAfterListenCallback);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function withRequest(app, callback) {
  const server = app.listen(0);

  try {
    await waitForListening(server);
    return await callback(request(server));
  } finally {
    await closeServer(server);
  }
}

test("createTransporter uses AOL by default and supports service override", (t) => {
  const originalCreateTransport = nodemailer.createTransport;
  const calls = [];

  nodemailer.createTransport = (config) => {
    calls.push(config);
    return { config };
  };

  t.after(() => {
    nodemailer.createTransport = originalCreateTransport;
  });

  const defaultTransporter = createTransporter({
    NODEMAILER_USER: "sender@example.com",
    NODEMAILER_PASS: "secret",
  });
  const customTransporter = createTransporter({
    NODEMAILER_SERVICE: "Gmail",
    NODEMAILER_USER: "gmail@example.com",
    NODEMAILER_PASS: "gmail-secret",
  });

  assert.deepEqual(defaultTransporter.config, {
    service: "AOL",
    auth: {
      user: "sender@example.com",
      pass: "secret",
    },
  });
  assert.deepEqual(customTransporter.config, {
    service: "Gmail",
    auth: {
      user: "gmail@example.com",
      pass: "gmail-secret",
    },
  });
  assert.equal(calls.length, 2);
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

test("validateProposal rejects proposals missing only artist or description", () => {
  assert.equal(
    validateProposal({
      artist: "",
      email: "artist@example.com",
      description: "A complete proposal description.",
    }).error,
    "Artist and description are required."
  );
  assert.equal(
    validateProposal({
      artist: "Example Artist",
      email: "artist@example.com",
      description: "",
    }).error,
    "Artist and description are required."
  );
});

test("validateProposal rejects invalid email after required fields pass", () => {
  const result = validateProposal({
    artist: "Example Artist",
    email: "not-an-email",
    description: "A complete proposal description.",
  });

  assert.equal(result.error, "A valid email address is required.");
});

test("validateProposal normalizes non-strings and trims overlong fields", () => {
  const result = validateProposal({
    artist: "A".repeat(140),
    email: "artist@example.com",
    phone: 12345,
    description: "D".repeat(3100),
  });

  assert.equal(result.error, undefined);
  assert.equal(result.proposal.artist.length, 120);
  assert.equal(result.proposal.phone, "");
  assert.equal(result.proposal.description.length, 3000);
});

test("GET /whitelist does not expose admin identifiers", async () => {
  const app = createApp({
    staticRoot: makeStaticRoot(),
    env: {
      ADMIN_UIDS: "admin-1",
      LOCAL_ADMIN_UIDS: "local-admin",
    },
    transporter: { sendMail: async () => ({ messageId: "unused" }) },
  });

  await withRequest(app, (agent) =>
    agent.get("/whitelist").expect(404).expect({ message: "not found" })
  );
});

test("createApp can use process defaults without injected options", async (t) => {
  const originalCreateTransport = nodemailer.createTransport;
  const createTransportCalls = [];

  nodemailer.createTransport = (config) => {
    createTransportCalls.push(config);
    return {
      sendMail: async () => ({ messageId: "unused" }),
    };
  };

  t.after(() => {
    nodemailer.createTransport = originalCreateTransport;
  });

  const app = createApp();

  await withRequest(app, (agent) => agent.get("/whitelist").expect(404));

  assert.equal(createTransportCalls.length, 1);
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

  await withRequest(app, (agent) =>
    agent
      .post("/send")
      .send({ artist: "", email: "bad", description: "" })
      .expect(400)
      .expect({ message: "Artist and description are required." })
  );

  assert.equal(calls.length, 0);
});

test("POST /send treats a missing body as an invalid proposal", async () => {
  const app = createApp({
    staticRoot: makeStaticRoot(),
    env: {},
    transporter: { sendMail: async () => ({ messageId: "unused" }) },
  });

  await withRequest(app, (agent) =>
    agent
      .post("/send")
      .expect(400)
      .expect({ message: "Artist and description are required." })
  );
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

  await withRequest(app, (agent) =>
    agent
      .post("/send")
      .send({
        artist: "Example Artist",
        email: "artist@example.com",
        phone: "802-555-1212",
        description: "Example proposal",
      })
      .expect(200)
      .expect({ message: "message has been sent" })
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].from, "sender@example.com");
  assert.equal(calls[0].to, "recipient@example.com");
  assert.match(calls[0].text, /Artist Name: Example Artist/);
});

test("POST /send uses default transporter when none is injected", async (t) => {
  const originalCreateTransport = nodemailer.createTransport;
  const createTransportCalls = [];
  const sendMailCalls = [];

  nodemailer.createTransport = (config) => {
    createTransportCalls.push(config);
    return {
      sendMail: async (message) => {
        sendMailCalls.push(message);
        return { messageId: "default-transporter-msg" };
      },
    };
  };

  t.after(() => {
    nodemailer.createTransport = originalCreateTransport;
  });

  const app = createApp({
    staticRoot: makeStaticRoot(),
    env: {
      NODEMAILER_SERVICE: "Gmail",
      NODEMAILER_USER: "sender@example.com",
      NODEMAILER_PASS: "secret",
      NODEMAILER_RECIPIENT: "recipient@example.com",
    },
  });

  await withRequest(app, (agent) =>
    agent
      .post("/send")
      .send({
        artist: "Default Transport",
        email: "artist@example.com",
        phone: "",
        description: "Uses createTransport",
      })
      .expect(200)
      .expect({ message: "message has been sent" })
  );

  assert.deepEqual(createTransportCalls[0], {
    service: "Gmail",
    auth: {
      user: "sender@example.com",
      pass: "secret",
    },
  });
  assert.equal(sendMailCalls.length, 1);
});

test("POST /send returns a safe error when email delivery fails", async (t) => {
  const originalConsoleError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);

  t.after(() => {
    console.error = originalConsoleError;
  });

  const app = createApp({
    staticRoot: makeStaticRoot(),
    env: {},
    transporter: {
      sendMail: async () => {
        throw new Error("smtp offline");
      },
    },
  });

  await withRequest(app, (agent) =>
    agent
      .post("/send")
      .send({
        artist: "Example Artist",
        email: "artist@example.com",
        description: "Example proposal",
      })
      .expect(502)
      .expect({ message: "something went wrong" })
  );

  assert.match(errors[0][0], /Error occurred sending proposal email/);
  assert.equal(errors[0][1], "smtp offline");
});

test("GET unknown route serves SPA fallback", async () => {
  const app = createApp({
    staticRoot: makeStaticRoot(),
    env: {},
    transporter: { sendMail: async () => ({ messageId: "unused" }) },
  });

  await withRequest(app, (agent) =>
    agent.get("/Season").expect(200).expect("Content-Type", /html/)
  );
});

test("startServer verifies transporter and returns the listening server", async () => {
  const logs = [];
  const transporter = {
    verify: (callback) => callback(null),
    sendMail: async () => ({ messageId: "unused" }),
  };
  const server = startServer({
    port: 0,
    staticRoot: makeStaticRoot(),
    transporter,
    logger: {
      log: (...args) => logs.push(args.join(" ")),
    },
  });

  try {
    await waitForListening(server);

    assert.ok(logs.includes("Server ready to take messages"));
    assert.ok(logs.some((entry) => entry === "Listening on port: 0"));
  } finally {
    await closeServer(server);
  }
});

test("startServer logs transporter verification errors", async () => {
  const logs = [];
  const verifyError = new Error("bad credentials");
  const server = startServer({
    port: 0,
    staticRoot: makeStaticRoot(),
    transporter: {
      verify: (callback) => callback(verifyError),
      sendMail: async () => ({ messageId: "unused" }),
    },
    logger: {
      log: (...args) => logs.push(args),
    },
  });

  try {
    await waitForListening(server);

    assert.equal(logs[0][0], verifyError);
  } finally {
    await closeServer(server);
  }
});

test("startServer can use process env, console logger, and default transporter", async (t) => {
  const originalCreateTransport = nodemailer.createTransport;
  const originalPort = process.env.PORT;
  const originalConsoleLog = console.log;
  const logs = [];
  const createTransportCalls = [];

  process.env.PORT = "0";
  console.log = (...args) => logs.push(args.join(" "));
  nodemailer.createTransport = (config) => {
    createTransportCalls.push(config);
    return {
      verify: (callback) => callback(null),
      sendMail: async () => ({ messageId: "unused" }),
    };
  };

  t.after(() => {
    nodemailer.createTransport = originalCreateTransport;
    console.log = originalConsoleLog;
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  });

  const server = startServer();

  try {
    await waitForListening(server);

    assert.equal(createTransportCalls.length, 1);
    assert.ok(logs.includes("Server ready to take messages"));
    assert.ok(logs.includes("Listening on port: 0"));
  } finally {
    await closeServer(server);
  }
});
