import { cleanup, render, screen } from "@testing-library/react";
import PropTypes from "prop-types";
import { afterEach, describe, expect, test, vi } from "vitest";
import App from "../App";

vi.mock("../config/authContext", () => ({
  AuthProvider: MockAuthProvider,
}));

function MockAuthProvider({ children }) {
  return <div data-testid="auth-provider">{children}</div>;
}

MockAuthProvider.propTypes = {
  children: PropTypes.node,
};

vi.mock("../pages/home/Home", () => ({
  default: () => <h1>Home Route</h1>,
}));

vi.mock("../pages/season/Season", () => ({
  default: () => <h1>Season Route</h1>,
}));

vi.mock("../pages/about/About", () => ({
  default: () => <h1>About Route</h1>,
}));

vi.mock("../pages/artists/Artists", () => ({
  default: () => <h1>Artists Route</h1>,
}));

vi.mock("../pages/donate/Donate", () => ({
  default: () => <h1>Donate Route</h1>,
}));

vi.mock("../pages/artist_portal/ArtistPortal", () => ({
  default: () => <h1>Artist Portal Route</h1>,
}));

vi.mock("../pages/admin_portal/AdminPortal", () => ({
  default: () => <h1>Admin Portal Route</h1>,
}));

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
});

describe("App shell routing", () => {
  test.each([
    ["/", "Home Route"],
    ["/Season", "Season Route"],
    ["/About", "About Route"],
    ["/Artists", "Artists Route"],
    ["/Donate", "Donate Route"],
    ["/ArtistPortal", "Artist Portal Route"],
    ["/adminDash", "Admin Portal Route"],
  ])("renders %s route inside the shared shell", (path, heading) => {
    window.history.pushState({}, "", path);

    render(<App />);

    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /admin login/i })).toHaveAttribute(
      "href",
      "/adminDash"
    );
  });
});
