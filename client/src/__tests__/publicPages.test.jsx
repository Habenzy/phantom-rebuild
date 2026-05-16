import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Home from "../pages/home/Home";
import Season from "../pages/season/Season";
import ArtistsList from "../pages/artists/Artists";
import Donate from "../pages/donate/Donate";

const firestore = vi.hoisted(() => ({
  docsByCollection: {},
  errorsByCollection: {},
  collection: vi.fn((db, name) => ({ name })),
  query: vi.fn((ref) => ref),
  where: vi.fn((field, operator, value) => ({ field, operator, value })),
  getDocs: vi.fn((ref) => {
    if (firestore.errorsByCollection[ref.name]) {
      return Promise.reject(firestore.errorsByCollection[ref.name]);
    }

    return Promise.resolve({
      docs: firestore.docsByCollection[ref.name] || [],
    });
  }),
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
  firestore.errorsByCollection = {};
  firestore.collection.mockClear();
  firestore.query.mockClear();
  firestore.where.mockClear();
  firestore.getDocs.mockClear();
});

describe("public pages", () => {
  test("home keeps the barn image fallback when there are no upcoming shows", async () => {
    firestore.docsByCollection.shows = [];

    renderWithRouter(<Home />);

    expect(
      await screen.findByRole("heading", { name: "Show Times Coming Soon!" })
    ).toBeInTheDocument();
    expect(screen.getByAltText("Now Showing")).toHaveAttribute(
      "src",
      expect.stringContaining("barn3crop")
    );
  });

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

  test("home sorts upcoming shows and uses fallback ticket links", async () => {
    firestore.docsByCollection.shows = [
      doc("later-show", {
        title: "Later Show",
        dates: [{ date: "2099-07-01T19:30", ticketLink: "https://tickets.example.com/later" }],
        imageLg: "/later.jpg",
      }),
      doc("earlier-show", {
        title: "Earlier Show",
        dates: [{ date: "2099-06-01T19:30" }],
        imageLg: "/earlier.jpg",
      }),
      doc("undated-show", {
        title: "Undated Show",
        dates: [],
        imageLg: "/undated.jpg",
      }),
    ];

    renderWithRouter(<Home />);

    expect(await screen.findByRole("heading", { name: "Earlier Show" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Later Show" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Undated Show" })).not.toBeInTheDocument();
    expect(screen.getByAltText("Now Showing")).toHaveAttribute("src", "/earlier.jpg");

    const ticketLinks = screen.getAllByRole("link", { name: /buy tickets/i });
    expect(ticketLinks[0]).toHaveAttribute("href", "https://theaterengine.com/companies/1");
    expect(ticketLinks[1]).toHaveAttribute("href", "https://tickets.example.com/later");
  });

  test("home formats morning showtimes with padded minutes and fallback next-show tickets", async () => {
    firestore.docsByCollection.shows = [
      doc("morning-show", {
        title: "Morning Show",
        dates: [{ date: "2099-06-01T09:05", ticketLink: "https://tickets.example.com/morning" }],
        imageLg: "/morning.jpg",
      }),
      doc("next-show", {
        title: "Next Show",
        dates: [{ date: "2099-06-02T10:05" }],
        imageLg: "/next.jpg",
      }),
    ];

    renderWithRouter(<Home />);

    expect(await screen.findByText(/9:05 am/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /buy tickets/i })[1]).toHaveAttribute(
      "href",
      "https://theaterengine.com/companies/1"
    );
  });

  test("home replaces unsafe ticket links with the ticket fallback", async () => {
    firestore.docsByCollection.shows = [
      doc("unsafe-ticket-show", {
        title: "Unsafe Ticket Show",
        dates: [{ date: "2099-06-01T19:30", ticketLink: "javascript:alert(1)" }],
        imageLg: "/unsafe.jpg",
      }),
    ];

    renderWithRouter(<Home />);

    expect(
      await screen.findByRole("heading", { name: "Unsafe Ticket Show" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buy tickets/i })).toHaveAttribute(
      "href",
      "https://theaterengine.com/companies/1"
    );
  });

  test("home logs Firestore errors without replacing fallback content", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    firestore.errorsByCollection.shows = new Error("Firestore unavailable");

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith("Firestore unavailable");
    });
    expect(screen.getByRole("heading", { name: "Show Times Coming Soon!" })).toBeInTheDocument();
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

  test("season sorts shows, renders fallback ticket links, multiple images, and named artists", async () => {
    firestore.docsByCollection.shows = [
      doc("later-show", {
        title: "Later Show",
        dates: [{ date: "2099-08-01T19:30", ticketLink: "https://tickets.example.com/later" }],
        artists: ["artist-1"],
        blurb: "Later blurb.",
        imageLg: "/later.jpg",
        contactName: "Later Producer",
      }),
      doc("earlier-show", {
        title: "Earlier Show",
        dates: [{ date: "2099-06-01T19:30" }],
        artists: ["artist-2"],
        blurb: "Earlier blurb.",
        imageLg: "/earlier.jpg",
        image2: "/earlier-2.jpg",
        image3: "/earlier-3.jpg",
        contactName: "Earlier Producer",
      }),
      doc("past-show", {
        title: "Past Show",
        dates: [{ date: "2024-01-01T19:30", ticketLink: "https://tickets.example.com/past" }],
        artists: [],
        blurb: "Past blurb.",
        imageLg: "/past.jpg",
        contactName: "Past Producer",
      }),
    ];
    firestore.docsByCollection.artists = [
      doc("artist-1", { artist: "Artist Field" }),
      doc("artist-2", { name: "Name Field Artist" }),
    ];

    render(<Season />);

    const earlierHeading = await screen.findByRole("heading", { name: /Earlier Show/ });
    const laterHeading = await screen.findByRole("heading", { name: /Later Show/ });

    expect(earlierHeading.compareDocumentPosition(laterHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(await screen.findByRole("heading", { name: "Name Field Artist" })).toBeInTheDocument();
    expect(screen.getByText("Earlier Producer")).toBeInTheDocument();
    expect(screen.getAllByAltText("show-image")).toHaveLength(5);
    expect(screen.getAllByRole("link", { name: /buy tickets/i })[0]).toHaveAttribute(
      "href",
      "https://theaterengine.com/companies/1"
    );
  });

  test("season scrolls to the location hash after show data loads", async () => {
    const originalHash = window.location.hash;
    window.location.hash = "#future-show";

    try {
      firestore.docsByCollection.shows = [
        doc("future-show", {
          title: "Opening Night",
          dates: [{ date: "2099-06-01T19:30", ticketLink: "https://tickets.example.com/opening" }],
          artists: [],
          blurb: "A new performance.",
          imageLg: "/opening.jpg",
        }),
      ];
      firestore.docsByCollection.artists = [];

      render(<Season />);

      const heading = await screen.findByRole("heading", { name: /Opening Night/ });
      const scrollIntoView = vi.fn();
      heading.closest("#future-show").scrollIntoView = scrollIntoView;

      await waitFor(() => expect(scrollIntoView).toHaveBeenCalled(), {
        timeout: 2000,
      });
    } finally {
      window.location.hash = originalHash;
    }
  });

  test("season logs Firestore load failures", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    firestore.errorsByCollection.shows = new Error("shows failed");
    firestore.errorsByCollection.artists = new Error("artists failed");

    render(<Season />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith("shows failed");
      expect(consoleError).toHaveBeenCalledWith("artists failed");
    });
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

  test("artists page supports legacy social fields and hides absent optional links", async () => {
    firestore.docsByCollection.artists = [
      doc("artist-1", {
        artist: "Legacy Artist",
        bio: "Legacy bio",
        email: "legacy@example.com",
        picUrl: "/legacy.jpg",
        web: "https://legacy.example.com",
        fb: "https://facebook.example.com/legacy",
        insta: "https://instagram.example.com/legacy",
        youtube: "https://youtube.example.com/legacy",
        spotify: "https://spotify.example.com/legacy",
      }),
      doc("artist-2", {
        artist: "No Links Artist",
        bio: "No links bio",
        email: "nolinks@example.com",
        picUrl: "/nolinks.jpg",
      }),
    ];

    render(<ArtistsList />);

    expect(await screen.findByRole("heading", { name: "Legacy Artist" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /website/i })).toHaveAttribute(
      "href",
      "https://legacy.example.com"
    );
    expect(screen.getByRole("link", { name: /facebook/i })).toHaveAttribute(
      "href",
      "https://facebook.example.com/legacy"
    );
    expect(screen.getByRole("link", { name: /youtube/i })).toHaveAttribute(
      "href",
      "https://youtube.example.com/legacy"
    );
    expect(screen.getByRole("link", { name: /spotify/i })).toHaveAttribute(
      "href",
      "https://spotify.example.com/legacy"
    );
    expect(screen.getByRole("heading", { name: "No Links Artist" })).toBeInTheDocument();
  });

  test("artists page hides unsafe social URLs from Firestore", async () => {
    firestore.docsByCollection.artists = [
      doc("artist-with-unsafe-links", {
        artist: "Unsafe Link Artist",
        bio: "Bio",
        email: "artist@example.com",
        picUrl: "/artist.jpg",
        web: "javascript:alert(1)",
        fb: "data:text/html,<script>alert(1)</script>",
        youtube: "http://youtube.example.com/channel",
        insta: "//instagram.example.com/artist",
        spotify: "https://open.spotify.com/artist/example",
      }),
    ];

    render(<ArtistsList />);

    expect(
      await screen.findByRole("heading", { name: "Unsafe Link Artist" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Website" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Facebook" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "YouTube" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Instagram" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spotify" })).toHaveAttribute(
      "href",
      "https://open.spotify.com/artist/example"
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

  test("donate page renders donation link and donor program copy", async () => {
    firestore.docsByCollection.donors = [doc("donor-a", { name: "Alice Donor" })];

    render(<Donate />);

    expect(await screen.findByText("Alice Donor")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Donate" })).toHaveAttribute(
      "href",
      "https://www.paypal.com/donate/?hosted_button_id=CU35GHQ4HTM6C"
    );
    expect(
      screen.getByRole("heading", { name: "Friends of the Artists" })
    ).toBeInTheDocument();
  });

  test("donate page keeps already sorted donor names in order", async () => {
    firestore.docsByCollection.donors = [
      doc("donor-a", { name: "Alice Donor" }),
      doc("donor-z", { name: "Zed Donor" }),
    ];

    render(<Donate />);

    const list = await screen.findByTestId("donor-list");
    const donors = within(list).getAllByText(/Donor$/).map((node) => node.textContent);

    expect(donors).toEqual(["Alice Donor", "Zed Donor"]);
  });
});
