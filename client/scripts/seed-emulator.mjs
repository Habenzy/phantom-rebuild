import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIREBASE_AUTH_EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

initializeApp({
  projectId: "demo-phantom-reboot",
});

const auth = getAuth();
const db = getFirestore();

const password = "password123";
const seededImage =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

async function getOrCreateUser(email) {
  try {
    const user = await auth.getUserByEmail(email);
    return auth.updateUser(user.uid, {
      emailVerified: true,
      password,
    });
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

const admin = await getOrCreateUser("admin@example.com");
const artist = await getOrCreateUser("artist@example.com");

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
  fb: "https://facebook.com/example",
  insta: "https://instagram.com/example",
  youtube: "https://youtube.com/example",
  spotify: "https://spotify.com/example",
  picUrl: seededImage,
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
  imageLg: seededImage,
  image2: "",
  image3: "",
});

await db.doc("shows/seed-artist-edit-show").set({
  title: "Seeded Artist Draft",
  type: "music",
  blurb: "An archived artist-owned show for browser edit coverage.",
  status: "archived",
  dates: [
    {
      date: "2099-08-15T20:00",
      ticketLink: "",
      soldOut: false,
    },
  ],
  artists: [artist.uid],
  contactName: "Example Artist",
  description: "Seeded artist-owned show description.",
  imageLg: seededImage,
  image2: "",
  image3: "",
});

await db.doc("shows/seed-admin-proposal").set({
  title: "Seeded Admin Proposal",
  type: "dance",
  blurb: "A proposed show for admin browser coverage.",
  status: "proposed",
  dates: [],
  artists: [artist.uid],
  contactName: "Admin Proposal Contact",
  description: "Internal proposed show description.",
  imageLg: seededImage,
  image2: "",
  image3: "",
});

await db.doc("shows/seed-proposed-show").set({
  title: "Seeded Proposed Show",
  type: "theater",
  blurb: "A seeded proposed show for local authorization testing.",
  status: "proposed",
  dates: [
    {
      date: "2099-07-01T19:30",
      ticketLink: "https://theaterengine.com/companies/1",
      soldOut: false,
    },
  ],
  artists: [artist.uid],
  contactName: "Example Producer",
  description: "Internal seeded proposed show description.",
  imageLg: "https://placehold.co/1200x800",
  image2: "",
  image3: "",
});

await db.doc("donors/seed-donor").set({
  name: "Example Donor",
});

await db.doc("donors/seed-delete-donor").set({
  name: "Delete Me Donor",
});

console.log("Seeded Firebase emulators.");
console.log(`Admin login: ${admin.email} / ${password}`);
console.log(`Artist login: ${artist.email} / ${password}`);
