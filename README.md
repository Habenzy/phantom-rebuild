# Phantom Rebuild

Phantom Theater site and artist/admin portal. The React client lives in `client/`; the root Express server serves the production build and handles server-only endpoints.

## Local Development

Install dependencies:

```sh
npm install
npm install --prefix client
```

Use Node 22 for local development:

```sh
nvm use
```

Create local client env:

```sh
cp client/.env.example client/.env.local
```

Run Firebase emulators:

```sh
npm run emulators:start
```

Seed local emulator data in a second terminal:

```sh
npm run emulators:seed
```

Run the Vite client:

```sh
npm --prefix client run dev
```

Use `client/.env.example` as the starting point for local Firebase emulator config. The app should use `demo-phantom-reboot` locally and should not point at production Firebase during development or tests.
Restart the Vite dev server after changing `.env.local`; Vite only reads env files at startup.

## Verification

Fast server and client regression tests:

```sh
npm test
npm run test:server
npm run test:client
```

Coverage checks:

```sh
npm run test:coverage
```

The coverage command runs server and client coverage checks. Both suites enforce 95%+ coverage thresholds, and generated coverage output is ignored by git.

Firebase emulator smoke tests, when emulators are already running:

```sh
npm run emulators:seed
npm --prefix client run test:integration
```

Use this path when the local Auth, Firestore, and Storage emulators are already occupying ports `9099`, `8080`, and `9199`.

To start fresh emulators and run the smoke test in one command:

```sh
npm run test:emulators
```

Do not use `npm run test:emulators` while another emulator process is already using ports `9099`, `8080`, and `9199`.

Install the Chromium browser used by Playwright once per machine:

```sh
npm run playwright:install
```

End-to-end browser tests, when emulators are already running:

```sh
npm run test:e2e
```

The Playwright suite starts the Vite dev server, seeds the local demo Firebase emulators, blocks non-local browser requests, and runs Chromium-only browser workflows against Auth, Firestore, and Storage. Use this path when emulator ports `9099`, `8080`, and `9199` are already occupied.

To start fresh emulators and run the browser suite in one command:

```sh
npm run test:e2e:emulators
```

Do not use `npm run test:e2e:emulators` while another emulator process is already using ports `9099`, `8080`, and `9199`.

Quality gates:

```sh
npm --prefix client run lint
npm --prefix client run build
npm audit --audit-level=high
npm audit --prefix client --audit-level=high
npm run test:emulators
```
