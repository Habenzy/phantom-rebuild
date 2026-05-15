import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ArtistPortal from "../pages/artist_portal/ArtistPortal";
import AdminPortal from "../pages/admin_portal/AdminPortal";

const firebase = vi.hoisted(() => ({
  auth: { currentUser: null },
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  collection: vi.fn((db, name) => ({ name })),
  doc: vi.fn((db, name, id) => ({ name, id })),
  query: vi.fn((ref) => ref),
  where: vi.fn((field, operator, value) => ({ field, operator, value })),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
  updateDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve()),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  deleteDoc: vi.fn(() => Promise.resolve()),
  getDownloadURL: vi.fn(() => Promise.resolve("https://storage.example.com/image.jpg")),
  ref: vi.fn((storage, name) => ({ name })),
  uploadBytes: vi.fn(() => Promise.resolve({ ref: {} })),
}));

vi.mock("../config/firebase", () => ({
  db: {},
  auth: firebase.auth,
  storage: {},
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: firebase.createUserWithEmailAndPassword,
  signInWithEmailAndPassword: firebase.signInWithEmailAndPassword,
  signOut: firebase.signOut,
}));

vi.mock("firebase/firestore", () => ({
  collection: firebase.collection,
  doc: firebase.doc,
  query: firebase.query,
  setDoc: firebase.setDoc,
  getDoc: firebase.getDoc,
  updateDoc: firebase.updateDoc,
  addDoc: firebase.addDoc,
  where: firebase.where,
  getDocs: firebase.getDocs,
  deleteDoc: firebase.deleteDoc,
}));

vi.mock("firebase/storage", () => ({
  getDownloadURL: firebase.getDownloadURL,
  ref: firebase.ref,
  uploadBytes: firebase.uploadBytes,
}));

beforeEach(() => {
  firebase.auth.currentUser = null;
  Object.values(firebase)
    .filter((value) => typeof value?.mockClear === "function")
    .forEach((mock) => mock.mockClear());

  firebase.getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
  firebase.getDocs.mockResolvedValue({ docs: [] });
  firebase.setDoc.mockResolvedValue();
  firebase.signOut.mockResolvedValue();
});

describe("portal flows", () => {
  test("artist sign-up creates an artist profile document", async () => {
    const user = userEvent.setup();
    const createdUser = { uid: "artist-uid", email: "artist@example.com" };
    firebase.createUserWithEmailAndPassword.mockImplementation(async () => {
      firebase.auth.currentUser = createdUser;
      return { user: createdUser };
    });
    firebase.getDoc.mockResolvedValue({
      data: () => ({
        artist: "",
        phone: "",
        email: "artist@example.com",
        bio: "",
      }),
    });

    render(<ArtistPortal />);

    await user.type(screen.getByPlaceholderText("enter your email address"), "artist@example.com");
    await user.type(screen.getByPlaceholderText("enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(firebase.setDoc).toHaveBeenCalledWith(
        { name: "artists", id: "artist-uid" },
        expect.objectContaining({ email: "artist@example.com" })
      );
    });
  });

  test("admin portal fails closed when the signed-in user is not an admin", async () => {
    const user = userEvent.setup();
    const signedInUser = { uid: "not-admin", email: "user@example.com" };
    firebase.signInWithEmailAndPassword.mockImplementation(async () => {
      firebase.auth.currentUser = signedInUser;
      return { user: signedInUser };
    });
    firebase.getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });

    render(<AdminPortal />);

    await user.type(screen.getByPlaceholderText("enter your email address"), "user@example.com");
    await user.type(screen.getByPlaceholderText("enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByRole("heading", { name: "403: Forbidden" })).toBeInTheDocument();
    expect(firebase.getDoc).toHaveBeenCalledWith({ name: "admins", id: "not-admin" });
  });
});
