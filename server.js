const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config();

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

function createTransporter(env = process.env) {
  return nodemailer.createTransport({
    service: env.NODEMAILER_SERVICE || "AOL",
    auth: {
      user: env.NODEMAILER_USER,
      pass: env.NODEMAILER_PASS,
    },
  });
}

function normalizeText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/[\r\n]+/g, " ").slice(0, maxLength);
}

function validateProposal(body) {
  const proposal = {
    artist: normalizeText(body.artist, 120),
    email: normalizeText(body.email, 254),
    phone: normalizeText(body.phone, 40),
    description: normalizeText(body.description, 3000),
  };

  if (!proposal.artist || !proposal.description) {
    return { error: "Artist and description are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(proposal.email)) {
    return { error: "A valid email address is required." };
  }

  return { proposal };
}

function createApp(options = {}) {
  const app = express();
  const env = options.env || process.env;
  const staticRoot = options.staticRoot || path.resolve("./client/dist");
  const transporter = options.transporter || createTransporter(env);

  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(express.static(staticRoot));
  app.use(express.urlencoded({ extended: true, limit: "25kb" }));
  app.use(express.json({ limit: "25kb" }));

  app.get("/whitelist", (req, res) => {
    res.json(getAdminUids(env));
  });

  app.post(
    "/send",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false,
    }),
    async (req, res) => {
      const { proposal, error } = validateProposal(req.body || {});

      if (error) {
        return res.status(400).json({ message: error });
      }

      const mailBody = [
        `Artist Name: ${proposal.artist}`,
        `Email: ${proposal.email}`,
        `Phone: ${proposal.phone}`,
        `Description: ${proposal.description}`,
      ].join("\n");

      const sentMsg = {
        from: env.NODEMAILER_USER,
        to: env.NODEMAILER_RECIPIENT,
        subject: "You have a new show proposal!",
        text: mailBody,
      };

      try {
        const info = await transporter.sendMail(sentMsg);
        console.log("Message sent: %s", info.messageId);
        return res.json({ message: "message has been sent" });
      } catch (err) {
        console.error("Error occurred sending proposal email:", err.message);
        return res.status(502).json({ message: "something went wrong" });
      }
    }
  );

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(staticRoot, "index.html"));
  });

  return app;
}

function startServer() {
  const port = process.env.PORT || 5000;
  const transporter = createTransporter();

  transporter.verify((error) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Server ready to take messages");
    }
  });

  const app = createApp({ transporter });
  app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  DEFAULT_ADMIN_UIDS,
  createApp,
  createTransporter,
  getAdminUids,
  startServer,
  validateProposal,
};
