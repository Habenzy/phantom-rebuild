// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const requiredProductionEnv = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_APP_ID",
];

if (import.meta.env.PROD) {
  const missing = requiredProductionEnv.filter((key) => !import.meta.env[key]);
  if (missing.length) {
    throw new Error(`Missing Firebase production environment variables: ${missing.join(", ")}`);
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-phantom-reboot.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-phantom-reboot",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-phantom-reboot.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

function shouldUseFirebaseEmulators(env, config) {
  const isDemoConfig =
    config.apiKey === "demo-key" || config.projectId.startsWith("demo-");

  return env.DEV && (env.VITE_FIREBASE_USE_EMULATORS === "true" || isDemoConfig);
}

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

//-----------export the database------
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

if (
  shouldUseFirebaseEmulators(import.meta.env, firebaseConfig) &&
  !globalThis.__PHANTOM_FIREBASE_EMULATORS_CONNECTED__
) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  globalThis.__PHANTOM_FIREBASE_EMULATORS_CONNECTED__ = true;
}

//------export the component---------
export default app;
