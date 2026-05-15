# Dependency Modernization, Security Hardening, and Regression Test Plan

## Summary

- Use a phased upgrade: add regression coverage first, then modernize dependencies, then harden production behavior.
- Preserve the current Heroku-style deployment: root Express server serves `client/dist`, `npm start` runs production, and build output remains Vite-based.
- Use Firebase Emulator Suite for local Auth, Firestore, and Storage coverage so tests never touch production Firebase.

## Key Changes

- Add local Firebase emulator support with `firebase.json`, Firestore/Storage rules, seeded emulator data, and dev env flags such as `VITE_FIREBASE_USE_EMULATORS=true`.
- Add regression tests before production changes:
  - Vitest + React Testing Library for page/component behavior.
  - Supertest for Express routes.
  - Playwright smoke flows against Vite + Express + Firebase emulators.
- Clean dependency ownership:
  - Root keeps server/runtime deps only.
  - Client owns React, Vite, Firebase browser SDK, and browser test tooling.
  - Remove the incorrect root `client` dependency and root `vite`/`firebase` if unused by the server.
- Upgrade to latest stable majors behind tests: Express 5, Firebase 12, Vite 8, React 19, React Router 7, Nodemailer 8, ESLint 9-compatible config.
- Harden security:
  - Replace hardcoded `/whitelist` UID array with tracked Firebase admin authorization, preferably `admins/{uid}` plus Firestore rules.
  - Add Firestore and Storage security rules for public reads, artist-owned writes, admin writes, and image upload constraints.
  - Add `helmet`, request body size limits, rate limiting, validation for `/send`, safer error handling, and no raw request body logging.
  - Fix external links to use `target="_blank"` with `rel="noreferrer noopener"`.

## Test Plan

- Baseline tests before upgrades:
  - Home renders upcoming booked shows from mocked/emulated Firestore data.
  - Season lists booked shows, ticket links, images, and artist references.
  - Artists and Donate pages render Firestore-backed records.
  - Artist portal supports sign-up/login, profile update, image upload path, and show proposal creation in emulator.
  - Admin portal allows seeded admin user and rejects non-admin user.
  - Express serves static app fallback, rejects invalid `/send`, and handles email-send success/failure with mocked Nodemailer.
- After each dependency/security phase:
  - Run `npm audit`, `npm test`, client lint, client build, server tests, emulator integration tests, and Playwright smoke tests.
  - Confirm emulator tests run with `demo-phantom-reboot` only and fail closed if emulator env vars are missing.
- Final acceptance:
  - No critical/high npm audit findings, except documented false positives if unavoidable.
  - Production build succeeds.
  - Local emulator workflow can exercise artist/admin/donor/show flows without production Firebase.

## Assumptions

- Deployment remains Heroku-style unless changed later.
- "Up to date" means latest stable major versions, but applied in phases with regression gates.
- Firebase security should be enforced with Firebase rules, not client-side UI checks.
- Test-only setup changes are allowed before dependency/security changes because they establish the regression safety net.
