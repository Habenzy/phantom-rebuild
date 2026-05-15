# Phantom Rebuild

Phantom Theater site and artist/admin portal. The React client lives in `client/`; the root Express server serves the production build and handles server-only endpoints.

## Local Development

Install dependencies:

```sh
npm install
npm install --prefix client
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

```sh
npm test
npm --prefix client run lint
npm --prefix client run build
npm audit
npm audit --prefix client
```
