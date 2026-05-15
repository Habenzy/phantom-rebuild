import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

initializeApp({
  projectId: "demo-phantom-reboot",
});

const auth = getAuth();
const db = getFirestore();

async function getOrCreateUser(email, password) {
  try {
    return await auth.getUserByEmail(email);
  } catch (err) {
    if (err.code !== "auth/user-not-found") {
      throw err;
    }

    return auth.createUser({
      email,
      password,
      emailVerified: true,
    });
  }
}

const admin = await getOrCreateUser("admin@example.com", "password123");
const artist = await getOrCreateUser("artist@example.com", "password123");

await db.doc(`admins/${admin.uid}`).set({
  email: admin.email,
  seeded: true,
});

await db.doc(`artists/${artist.uid}`).set({
  artist: "Example Artist",
  email: artist.email,
  phone: "802-555-1212",
  bio: "A seeded artist profile for local development.",
  web: "https://example.com",
  insta: "https://instagram.com/example",
  picUrl: "https://placehold.co/400x400",
});

await db.doc("shows/seed-show").set({
  title: "Seeded Summer Show",
  type: "theater",
  blurb: "A seeded booked show for local regression testing.",
  status: "booked",
  dates: [
    {
      date: "2099-06-01T19:30",
      ticketLink: "https://theaterengine.com/companies/1",
      soldOut: false,
    },
  ],
  artists: [artist.uid],
  contactName: "Example Producer",
  description: "Internal seeded show description.",
  imageLg: "https://placehold.co/1200x800",
  image2: "",
  image3: "",
});

await db.doc("donors/seed-donor").set({
  name: "Example Donor",
});

console.log("Seeded Firebase emulators.");
console.log("Admin login: admin@example.com / password123");
console.log("Artist login: artist@example.com / password123");
