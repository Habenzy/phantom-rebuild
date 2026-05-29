import { beforeEach, describe, expect, test, vi } from "vitest";

const firebase = vi.hoisted(() => ({
  app: { name: "phantom-test" },
  auth: { service: "auth" },
  db: { service: "firestore" },
  storage: { service: "storage" },
  connectAuthEmulator: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  connectStorageEmulator: vi.fn(),
  getApp: vi.fn(),
  getApps: vi.fn(),
  getAuth: vi.fn(),
  getFirestore: vi.fn(),
  getStorage: vi.fn(),
  initializeApp: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  getApp: firebase.getApp,
  getApps: firebase.getApps,
  initializeApp: firebase.initializeApp,
}));

vi.mock("firebase/auth", () => ({
  connectAuthEmulator: firebase.connectAuthEmulator,
  getAuth: firebase.getAuth,
}));

vi.mock("firebase/firestore", () => ({
  connectFirestoreEmulator: firebase.connectFirestoreEmulator,
  getFirestore: firebase.getFirestore,
}));

vi.mock("firebase/storage", () => ({
  connectStorageEmulator: firebase.connectStorageEmulator,
  getStorage: firebase.getStorage,
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  delete globalThis.__PHANTOM_FIREBASE_EMULATORS_CONNECTED__;

  firebase.getApps.mockReturnValue([]);
  firebase.getApp.mockReturnValue(firebase.app);
  firebase.initializeApp.mockReturnValue(firebase.app);
  firebase.getAuth.mockReturnValue(firebase.auth);
  firebase.getFirestore.mockReturnValue(firebase.db);
  firebase.getStorage.mockReturnValue(firebase.storage);

  firebase.getApp.mockClear();
  firebase.getApps.mockClear();
  firebase.initializeApp.mockClear();
  firebase.connectAuthEmulator.mockClear();
  firebase.connectFirestoreEmulator.mockClear();
  firebase.connectStorageEmulator.mockClear();
});

describe("firebase emulator bootstrap", () => {
  test("connects to local emulators when dev config uses demo Firebase values", async () => {
    await import("../config/firebase.js");

    expect(firebase.connectFirestoreEmulator).toHaveBeenCalledWith(
      firebase.db,
      "127.0.0.1",
      8080
    );
    expect(firebase.connectAuthEmulator).toHaveBeenCalledWith(
      firebase.auth,
      "http://127.0.0.1:9099",
      { disableWarnings: true }
    );
    expect(firebase.connectStorageEmulator).toHaveBeenCalledWith(
      firebase.storage,
      "127.0.0.1",
      9199
    );
  });

  test("reuses an existing Firebase app when one is already initialized", async () => {
    firebase.getApps.mockReturnValue([firebase.app]);

    const module = await import("../config/firebase.js");

    expect(firebase.getApp).toHaveBeenCalled();
    expect(firebase.initializeApp).not.toHaveBeenCalled();
    expect(module.default).toBe(firebase.app);
  });

  test("does not connect emulators more than once across module reloads", async () => {
    await import("../config/firebase.js");

    firebase.connectAuthEmulator.mockClear();
    firebase.connectFirestoreEmulator.mockClear();
    firebase.connectStorageEmulator.mockClear();
    vi.resetModules();

    await import("../config/firebase.js");

    expect(firebase.connectAuthEmulator).not.toHaveBeenCalled();
    expect(firebase.connectFirestoreEmulator).not.toHaveBeenCalled();
    expect(firebase.connectStorageEmulator).not.toHaveBeenCalled();
  });

  test("throws in production when required Firebase env values are missing", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);

    await expect(import("../config/firebase.js")).rejects.toThrow(
      "Missing Firebase production environment variables"
    );

    expect(firebase.initializeApp).not.toHaveBeenCalled();
  });

  test("uses production Firebase env values without connecting emulators", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_FIREBASE_API_KEY", "prod-api-key");
    vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "prod.example.com");
    vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "phantom-prod");
    vi.stubEnv("VITE_FIREBASE_STORAGE_BUCKET", "phantom-prod.appspot.com");
    vi.stubEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "sender-id");
    vi.stubEnv("VITE_FIREBASE_APP_ID", "prod-app-id");
    vi.stubEnv("VITE_FIREBASE_MEASUREMENT_ID", "measurement-id");

    await import("../config/firebase.js");

    expect(firebase.initializeApp).toHaveBeenCalledWith({
      apiKey: "prod-api-key",
      authDomain: "prod.example.com",
      projectId: "phantom-prod",
      storageBucket: "phantom-prod.appspot.com",
      messagingSenderId: "sender-id",
      appId: "prod-app-id",
      measurementId: "measurement-id",
    });
    expect(firebase.connectAuthEmulator).not.toHaveBeenCalled();
    expect(firebase.connectFirestoreEmulator).not.toHaveBeenCalled();
    expect(firebase.connectStorageEmulator).not.toHaveBeenCalled();
  });
});
