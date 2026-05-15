import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { AuthProvider } from "../config/authContext";
import { useAuth } from "../config/useAuth";

const firebaseAuth = vi.hoisted(() => ({
  auth: { service: "auth" },
  authStateCallback: null,
  onAuthStateChanged: vi.fn((auth, callback) => {
    firebaseAuth.authStateCallback = callback;
    return firebaseAuth.unsubscribe;
  }),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve("reset")),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve("login")),
  signOut: vi.fn(() => Promise.resolve("logout")),
  unsubscribe: vi.fn(),
}));

vi.mock("../config/firebase.js", () => ({
  auth: firebaseAuth.auth,
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: firebaseAuth.onAuthStateChanged,
  sendPasswordResetEmail: firebaseAuth.sendPasswordResetEmail,
  signInWithEmailAndPassword: firebaseAuth.signInWithEmailAndPassword,
  signOut: firebaseAuth.signOut,
}));

function AuthConsumer() {
  const { loggedUser, login, logout, resetPassword } = useAuth();

  return (
    <div>
      <p>{loggedUser ? loggedUser.email : "No user"}</p>
      <button onClick={() => login("artist@example.com", "password123")}>
        Login
      </button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => resetPassword("artist@example.com")}>
        Reset Password
      </button>
    </div>
  );
}

beforeEach(() => {
  firebaseAuth.authStateCallback = null;
  firebaseAuth.onAuthStateChanged.mockClear();
  firebaseAuth.sendPasswordResetEmail.mockClear();
  firebaseAuth.signInWithEmailAndPassword.mockClear();
  firebaseAuth.signOut.mockClear();
  firebaseAuth.unsubscribe.mockClear();
});

describe("AuthProvider", () => {
  test("waits for Firebase auth state before rendering children", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(screen.queryByText("No user")).not.toBeInTheDocument();

    firebaseAuth.authStateCallback({
      uid: "artist-uid",
      email: "artist@example.com",
    });

    expect(await screen.findByText("artist@example.com")).toBeInTheDocument();
    expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(
      firebaseAuth.auth,
      expect.any(Function)
    );
  });

  test("provides auth actions that delegate to Firebase Auth", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    firebaseAuth.authStateCallback(null);
    await screen.findByText("No user");

    await user.click(screen.getByRole("button", { name: "Login" }));
    await user.click(screen.getByRole("button", { name: "Logout" }));
    await user.click(screen.getByRole("button", { name: "Reset Password" }));

    await waitFor(() => {
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        firebaseAuth.auth,
        "artist@example.com",
        "password123"
      );
    });
    expect(firebaseAuth.signOut).toHaveBeenCalledWith(firebaseAuth.auth);
    expect(firebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
      firebaseAuth.auth,
      "artist@example.com"
    );
  });
});
