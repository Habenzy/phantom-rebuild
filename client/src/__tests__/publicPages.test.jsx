import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Home from "../pages/home/Home";
import Season from "../pages/season/Season";
import ArtistsList from "../pages/artists/Artists";
import Donate from "../pages/donate/Donate";

const firestore = vi.hoisted(() => ({
  docsByCollection: {},
  collection: vi.fn((db, name) => ({ name })),
  query: vi.fn((ref) => ref),
  where: vi.fn((field, operator, value) => ({ field, operator, value })),
  getDocs: vi.fn((ref) =>
    Promise.resolve({
      docs: firestore.docsByCollection[ref.name] || [],
    })
  ),
}));

vi.mock("../config/firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: firestore.collection,
  query: firestore.query,
  where: firestore.where,
  getDocs: firestore.getDocs,
}));

function doc(id, data) {
  return {
    id,
    data: () => data,
  };
}

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => {
  firestore.docsByCollection = {};
  firestore.collection.mockClear();
  firestore.query.mockClear();
  firestore.where.mockClear();
  firestore.getDocs.mockClear();
});

describe("public pages", () => {
  test("home renders the next booked show from Firestore", async () => {
    firestore.docsByCollection.shows = [
      doc("past-show", {
        title: "Past Show",
        dates: [{ date: "2024-01-01T19:30", ticketLink: "https://tickets.example.com/past" }],
        imageLg: "/past.jpg",
      }),
      doc("future-show", {
        title: "Opening Night",
        dates: [{ date: "2099-06-01T19:30", ticketLink: "https://tickets.example.com/opening" }],
        imageLg: "/opening.jpg",
      }),
    ];

    renderWithRouter(<Home />);

    expect(await screen.findByRole("heading", { name: "Opening Night" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Past Show" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buy tickets/i })).toHaveAttribute(
      "href",
      "https://tickets.example.com/opening"
    );
  });

  test("season renders booked shows with artists and date ticket links", async () => {
    firestore.docsByCollection.shows = [
      doc("future-show", {
        title: "Opening Night",
        dates: [{ date: "2099-06-01T19:30", ticketLink: "https://tickets.example.com/opening" }],
        artists: ["artist-1"],
        blurb: "A new performance.",
        imageLg: "/opening.jpg",
        contactName: "Producer",
      }),
    ];
    firestore.docsByCollection.artists = [doc("artist-1", { name: "Example Artist" })];

    render(<Season />);

    expect(await screen.findByRole("heading", { name: /Opening Night/ })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Example Artist" })).toBeInTheDocument();
    expect(screen.getByText("A new performance.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buy tickets/i })).toHaveAttribute(
      "href",
      "https://tickets.example.com/opening"
    );
  });

  test("artists page renders profile links from Firestore", async () => {
    firestore.docsByCollection.artists = [
      doc("artist-1", {
        artist: "Example Artist",
        bio: "Artist bio",
        email: "artist@example.com",
        picUrl: "/artist.jpg",
        website: "https://artist.example.com",
        instagram: "https://instagram.example.com/artist",
      }),
    ];

    render(<ArtistsList />);

    expect(await screen.findByRole("heading", { name: "Example Artist" })).toBeInTheDocument();
    expect(screen.getByText("Artist bio")).toBeInTheDocument();
    expect(screen.getByText("artist@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /website/i })).toHaveAttribute(
      "href",
      "https://artist.example.com"
    );
    expect(screen.getByRole("link", { name: /instagram/i })).toHaveAttribute(
      "href",
      "https://instagram.example.com/artist"
    );
  });

  test("donate page sorts donor names from Firestore", async () => {
    firestore.docsByCollection.donors = [
      doc("donor-b", { name: "Zed Donor" }),
      doc("donor-a", { name: "Alice Donor" }),
    ];

    render(<Donate />);

    const list = await screen.findByTestId("donor-list");
    const donors = within(list).getAllByText(/Donor$/).map((node) => node.textContent);

    expect(donors).toEqual(["Alice Donor", "Zed Donor"]);
  });
});
