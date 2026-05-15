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
  delete globalThis.__PHANTOM_FIREBASE_EMULATORS_CONNECTED__;

  firebase.getApps.mockReturnValue([]);
  firebase.initializeApp.mockReturnValue(firebase.app);
  firebase.getAuth.mockReturnValue(firebase.auth);
  firebase.getFirestore.mockReturnValue(firebase.db);
  firebase.getStorage.mockReturnValue(firebase.storage);

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
});
