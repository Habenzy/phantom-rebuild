// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBt1XPQKSrYdLn_NFPMLankYL-D785Mk1Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "phantom-reboot.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "phantom-reboot",
  storageBucket: import.meta.env.VITE_FIREBASE_STOREAGE_BUCKET || "phantom-reboot.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:764738129006:web:a752f4159e22125b87aa7f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "764738129006"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//-----------export the database------
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

//------export the component---------
export default app;
