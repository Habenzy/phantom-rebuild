import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, test } from "vitest";
import Home from "../pages/home/Home";
import Season from "../pages/season/Season";
import ArtistsList from "../pages/artists/Artists";
import Donate from "../pages/donate/Donate";

const describeEmulatorSmoke =
  globalThis.process?.env?.RUN_FIREBASE_EMULATOR_TESTS === "true"
    ? describe
    : describe.skip;

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

afterEach(() => {
  cleanup();
});

describeEmulatorSmoke("Firebase emulator public-page smoke flow", () => {
  test(
    "renders seeded shows, artists, and donors from local emulators",
    async () => {
      renderWithRouter(<Home />);
      expect(
        await screen.findByRole("heading", { name: "Seeded Summer Show" })
      ).toBeInTheDocument();
      cleanup();

      render(<Season />);
      expect(
        await screen.findByRole("heading", { name: /Seeded Summer Show/ })
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("heading", { name: "Example Artist" })
      ).toBeInTheDocument();
      cleanup();

      render(<ArtistsList />);
      expect(
        await screen.findByRole("heading", { name: "Example Artist" })
      ).toBeInTheDocument();
      expect(screen.getByText("A seeded artist profile for local development.")).toBeInTheDocument();
      cleanup();

      render(<Donate />);
      const donors = await screen.findByTestId("donor-list");
      expect(await within(donors).findByText("Example Donor")).toBeInTheDocument();
    },
    15000
  );
});
