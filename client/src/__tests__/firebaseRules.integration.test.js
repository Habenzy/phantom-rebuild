import { describe, expect, test } from "vitest";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../config/firebase";

const describeRules =
  globalThis.process?.env?.RUN_FIREBASE_EMULATOR_TESTS === "true"
    ? describe
    : describe.skip;

const TEST_TIMEOUT = 15000;

async function signInAs(email) {
  await signOut(auth).catch(() => {});
  const credential = await signInWithEmailAndPassword(auth, email, "password123");
  return credential.user;
}

async function expectPermissionDenied(promise) {
  await expect(promise).rejects.toMatchObject({ code: "permission-denied" });
}

async function expectStorageUnauthorized(promise) {
  try {
    await promise;
    throw new Error("expected storage upload to be rejected");
  } catch (err) {
    expect(["storage/unauthorized", "storage/unknown"]).toContain(err.code);
  }
}

function validShow(overrides = {}) {
  return {
    title: "Admin Created Show",
    type: "theater",
    blurb: "Public show blurb.",
    status: "proposed",
    dates: [
      {
        date: "2099-08-01T19:30",
        ticketLink: "https://theaterengine.com/companies/1",
        soldOut: false,
      },
    ],
    artists: ["artist-for-admin-created-show"],
    contactName: "Admin Producer",
    description: "Internal show notes.",
    imageLg: "https://placehold.co/1200x800",
    image2: "",
    image3: "",
    ...overrides,
  };
}

describeRules("Firebase security rules", () => {
  test(
    "artists cannot archive their own proposed shows",
    async () => {
      await signInAs("artist@example.com");

      await expectPermissionDenied(
        updateDoc(doc(db, "shows", "seed-proposed-show"), {
          status: "archived",
        })
      );
    },
    TEST_TIMEOUT
  );

  test(
    "artists cannot write unexpected profile fields",
    async () => {
      const artist = await signInAs("artist@example.com");

      await expectPermissionDenied(
        updateDoc(doc(db, "artists", artist.uid), {
          privateNote: "not allowed",
        })
      );
    },
    TEST_TIMEOUT
  );

  test(
    "admins can create and book shows",
    async () => {
      await signInAs("admin@example.com");
      const showRef = doc(db, "shows", "admin-created-rules-show");

      await setDoc(showRef, validShow());
      await updateDoc(showRef, { status: "booked" });

      const snapshot = await getDoc(showRef);
      expect(snapshot.data().status).toBe("booked");
    },
    TEST_TIMEOUT
  );

  test(
    "storage rejects unapproved image types even when the user owns the path",
    async () => {
      const artist = await signInAs("artist@example.com");
      const bitmap = new Blob(["bitmap"], {
        type: "image/bmp",
      });

      await expectStorageUnauthorized(
        uploadBytes(ref(storage, `uploads/${artist.uid}/bad.bmp`), bitmap)
      );
    },
    TEST_TIMEOUT
  );
});
