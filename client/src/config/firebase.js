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
  apiKey: import.meta.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.VITE_FIREBASE_STOREAGE_BUCKET,
  messagingSenderId: import.meta.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.VITE_FIREBASE_MEASUREMENT_ID
};

console.log(firebaseConfig.apiKey)

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//-----------export the database------
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

//------export the component---------
export default app;
