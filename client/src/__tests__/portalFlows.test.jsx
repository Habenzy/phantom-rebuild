import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ArtistPortal from "../pages/artist_portal/ArtistPortal";
import AdminPortal from "../pages/admin_portal/AdminPortal";

const firebase = vi.hoisted(() => ({
  auth: { currentUser: null },
  docsByCollection: {},
  docsByPath: {},
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  collection: vi.fn((db, name) => ({ name })),
  doc: vi.fn((dbOrCollection, name, id) => {
    if (name === undefined && dbOrCollection?.name) {
      return { name: dbOrCollection.name, id: "generated-id" };
    }

    return { name, id };
  }),
  query: vi.fn((ref) => ref),
  where: vi.fn((field, operator, value) => ({ field, operator, value })),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn((ref) => {
    const value = firebase.docsByPath[`${ref.name}/${ref.id}`];
    return Promise.resolve({
      exists: () => Boolean(value),
      data: () => value || {},
    });
  }),
  updateDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve()),
  getDocs: vi.fn((ref) =>
    Promise.resolve({
      docs: firebase.docsByCollection[ref.name] || [],
    })
  ),
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
  firebase.docsByCollection = {};
  firebase.docsByPath = {};
  Object.values(firebase)
    .filter((value) => typeof value?.mockClear === "function")
    .forEach((mock) => mock.mockClear());

  firebase.doc.mockImplementation((dbOrCollection, name, id) => {
    if (name === undefined && dbOrCollection?.name) {
      return { name: dbOrCollection.name, id: "generated-id" };
    }

    return { name, id };
  });
  firebase.getDoc.mockImplementation((ref) => {
    const value = firebase.docsByPath[`${ref.name}/${ref.id}`];
    return Promise.resolve({
      exists: () => Boolean(value),
      data: () => value || {},
    });
  });
  firebase.getDocs.mockImplementation((ref) =>
    Promise.resolve({
      docs: firebase.docsByCollection[ref.name] || [],
    })
  );
  firebase.setDoc.mockResolvedValue();
  firebase.updateDoc.mockResolvedValue();
  firebase.addDoc.mockResolvedValue();
  firebase.deleteDoc.mockResolvedValue();
  firebase.signOut.mockResolvedValue();
  firebase.uploadBytes.mockResolvedValue({ ref: { path: "uploaded" } });
  firebase.getDownloadURL.mockResolvedValue("https://storage.example.com/image.jpg");
  window.alert = vi.fn();
});

function doc(id, data) {
  return {
    id,
    data: () => data,
  };
}


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

  test("artist sign-up shows account creation errors", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    firebase.createUserWithEmailAndPassword.mockRejectedValue(new Error("signup failed"));

    render(<ArtistPortal />);

    await user.type(screen.getByPlaceholderText("enter your email address"), "artist@example.com");
    await user.type(screen.getByPlaceholderText("enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("signup failed")).toBeInTheDocument();
  });

  test("artist portal shows login errors", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    firebase.signInWithEmailAndPassword.mockRejectedValue(new Error("bad login"));

    render(<ArtistPortal />);

    await user.type(screen.getByPlaceholderText("enter your email address"), "artist@example.com");
    await user.type(screen.getByPlaceholderText("enter your password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByText("bad login")).toBeInTheDocument();
  });

  test("artist portal loads a profile, updates it, and logs out", async () => {
    const user = userEvent.setup();
    const signedInUser = { uid: "artist-uid", email: "artist@example.com" };
    firebase.signInWithEmailAndPassword.mockImplementation(async () => {
      firebase.auth.currentUser = signedInUser;
      return { user: signedInUser };
    });
    firebase.docsByPath["artists/artist-uid"] = {
      artist: "Example Artist",
      phone: "802-555-1212",
      email: "artist@example.com",
      bio: "Artist bio",
      web: "https://artist.example.com",
      fb: "https://facebook.example.com/artist",
      insta: "https://instagram.example.com/artist",
      spotify: "https://spotify.example.com/artist",
      youtube: "https://youtube.example.com/artist",
      picUrl: "https://storage.example.com/profile.jpg",
    };
    firebase.docsByCollection.shows = [];

    const { container } = render(<ArtistPortal />);

    await user.type(screen.getByPlaceholderText("enter your email address"), "artist@example.com");
    await user.type(screen.getByPlaceholderText("enter your password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(
      await screen.findByRole("heading", {
        name: /Welcome Example Artist to your Phantom Theater Artist portal/i,
      })
    ).toBeInTheDocument();

    const artistInput = container.querySelector('input[name="artist"]');
    await user.clear(artistInput);
    await user.type(artistInput, "Updated Artist");
    await user.clear(container.querySelector('input[name="phone"]'));
    await user.type(container.querySelector('input[name="phone"]'), "802-555-0000");
    await user.clear(container.querySelector('input[name="email"]'));
    await user.type(container.querySelector('input[name="email"]'), "updated@example.com");
    await user.clear(container.querySelector('input[name="bio"]'));
    await user.type(container.querySelector('input[name="bio"]'), "Updated bio");
    await user.clear(container.querySelector('input[name="website"]'));
    await user.type(container.querySelector('input[name="website"]'), "https://updated.example.com");
    await user.clear(container.querySelector('input[name="fb"]'));
    await user.type(container.querySelector('input[name="fb"]'), "https://facebook.example.com/updated");
    await user.clear(container.querySelector('input[name="insta"]'));
    await user.type(container.querySelector('input[name="insta"]'), "https://instagram.example.com/updated");
    await user.clear(container.querySelector('input[name="spotify"]'));
    await user.type(container.querySelector('input[name="spotify"]'), "https://spotify.example.com/updated");
    await user.clear(container.querySelector('input[name="youtube"]'));
    await user.type(container.querySelector('input[name="youtube"]'), "https://youtube.example.com/updated");

    await user.upload(
      container.querySelector('input[name="splash-img"]'),
      new File(["profile"], "profile.jpg", { type: "image/jpeg" })
    );
    await user.click(screen.getAllByRole("button", { name: /Upload your image/i })[0]);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Image uploaded to Database");
    });

    await user.click(screen.getByRole("button", { name: "Update your information" }));

    await waitFor(() => {
      expect(firebase.updateDoc).toHaveBeenCalledWith(
        { name: "artists", id: "artist-uid" },
        expect.objectContaining({
          artist: "Updated Artist",
          phone: "802-555-0000",
          email: "updated@example.com",
          bio: "Updated bio",
          web: "https://updated.example.com",
          fb: "https://facebook.example.com/updated",
          insta: "https://instagram.example.com/updated",
          spotify: "https://spotify.example.com/updated",
          youtube: "https://youtube.example.com/updated",
          picUrl: "https://storage.example.com/image.jpg",
        })
      );
    });

    await user.click(screen.getByRole("button", { name: "Log Out" }));

    await waitFor(() => {
      expect(firebase.signOut).toHaveBeenCalledWith(firebase.auth);
    });
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  test("artist portal uploads proposal images and creates a show proposal", async () => {
    const user = userEvent.setup();
    firebase.auth.currentUser = { uid: "artist-uid", email: "artist@example.com" };
    firebase.docsByPath["artists/artist-uid"] = {
      artist: "Example Artist",
      email: "artist@example.com",
    };
    firebase.docsByCollection.shows = [];

    const { container } = render(<ArtistPortal />);

    await screen.findByRole("heading", {
      name: /Welcome Example Artist to your Phantom Theater Artist portal/i,
    });
    await user.click(screen.getByRole("button", { name: "Create Show Proposal" }));

    expect(container.querySelector('input[name="splash-img"]')).toHaveAttribute(
      "accept",
      "image/*"
    );
    expect(
      screen.getAllByRole("button", { name: /Upload your image to the Database/i })[0]
    ).toBeDisabled();

    await user.clear(container.querySelector('input[name="title"]'));
    await user.type(container.querySelector('input[name="title"]'), "New Proposal");
    await user.clear(container.querySelector('input[name="contact"]'));
    await user.type(container.querySelector('input[name="contact"]'), "New Producer");
    await user.clear(container.querySelector('input[name="type"]'));
    await user.type(container.querySelector('input[name="type"]'), "Dance");
    await user.clear(container.querySelector('input[name="description"]'));
    await user.type(container.querySelector('input[name="description"]'), "A new proposal");

    const coverFile = new File(["cover"], "cover poster.jpg", { type: "image/jpeg" });
    const secondFile = new File(["second"], "second.jpg", { type: "image/jpeg" });
    const thirdFile = new File(["third"], "third.jpg", { type: "image/jpeg" });

    await user.upload(container.querySelector('input[name="splash-img"]'), coverFile);
    await user.click(screen.getAllByRole("button", { name: /Upload your image/i })[0]);
    await user.upload(container.querySelector('input[name="img-2"]'), secondFile);
    await user.click(screen.getAllByRole("button", { name: /Upload your image/i })[1]);
    await user.upload(container.querySelector('input[name="img-3"]'), thirdFile);
    await user.click(screen.getAllByRole("button", { name: /Upload your image/i })[2]);

    await waitFor(() => {
      expect(firebase.getDownloadURL).toHaveBeenCalledTimes(3);
    });

    await user.click(screen.getByRole("button", { name: "Submit your show details" }));

    await waitFor(() => {
      expect(firebase.addDoc).toHaveBeenCalledWith(
        { name: "shows" },
        expect.objectContaining({
          title: "New Proposal",
          type: "Dance",
          contactName: "New Producer",
          description: "A new proposal",
          artists: ["artist-uid"],
          imageLg: "https://storage.example.com/image.jpg",
          image2: "https://storage.example.com/image.jpg",
          image3: "https://storage.example.com/image.jpg",
        })
      );
    });
  });

  test("artist portal edits an existing submitted show", async () => {
    const user = userEvent.setup();
    firebase.auth.currentUser = { uid: "artist-uid", email: "artist@example.com" };
    firebase.docsByPath["artists/artist-uid"] = {
      artist: "Example Artist",
      email: "artist@example.com",
    };
    firebase.docsByCollection.shows = [
      doc("existing-show", {
        title: "Existing Show",
        type: "theater",
        status: "proposed",
        dates: [],
        contactName: "Producer",
        description: "Existing description",
        imageLg: "https://storage.example.com/existing.jpg",
        image2: "",
        image3: "",
      }),
      doc("empty-existing-show", {}),
    ];

    render(<ArtistPortal />);

    expect(await screen.findByRole("heading", { name: /Existing Show - proposed/i })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Submit your show details" })[0]);

    await waitFor(() => {
      expect(firebase.setDoc).toHaveBeenCalledWith(
        { name: "shows", id: "existing-show" },
        expect.objectContaining({
          title: "Existing Show",
          imageLg: "https://storage.example.com/existing.jpg",
        })
      );
    });
  });

  test("artist portal handles missing profile defaults and upload failures", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    firebase.auth.currentUser = { uid: "artist-uid", email: "artist@example.com" };
    firebase.docsByPath["artists/artist-uid"] = {};
    firebase.docsByCollection.shows = [];
    firebase.uploadBytes.mockRejectedValue(new Error("upload failed"));

    const { container } = render(<ArtistPortal />);

    expect(
      await screen.findByRole("heading", {
        name: /Welcome\s+to your Phantom Theater Artist portal/i,
      })
    ).toBeInTheDocument();

    await user.upload(
      container.querySelector('input[name="splash-img"]'),
      new File(["profile"], "profile.jpg", { type: "image/jpeg" })
    );
    await user.click(screen.getAllByRole("button", { name: /Upload your image/i })[0]);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("upload failed");
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

  test("admin portal shows login errors", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    firebase.signInWithEmailAndPassword.mockRejectedValue(new Error("admin login failed"));

    render(<AdminPortal />);

    await user.type(screen.getByPlaceholderText("enter your email address"), "admin@example.com");
    await user.type(screen.getByPlaceholderText("enter your password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    expect(await screen.findByText("admin login failed")).toBeInTheDocument();
  });

  test("admin portal manages shows, artist profiles, and donors", async () => {
    const user = userEvent.setup();
    firebase.auth.currentUser = { uid: "admin-uid", email: "admin@example.com" };
    firebase.docsByPath["admins/admin-uid"] = { email: "admin@example.com" };
    firebase.docsByCollection.shows = [
      doc("show-1", {
        title: "Admin Show",
        type: "music",
        status: "booked",
        description: "Internal description",
        contactName: "Producer",
        artists: ["artist-uid"],
        dates: [
          {
            date: "2099-06-01T19:30",
            ticketLink: "https://tickets.example.com/show",
            soldOut: false,
          },
        ],
        blurb: "Public blurb",
        imageLg: "https://storage.example.com/show.jpg",
        image2: "https://storage.example.com/show-2.jpg",
        image3: "https://storage.example.com/show-3.jpg",
      }),
      doc("empty-show", {}),
    ];
    firebase.docsByCollection.artists = [
      doc("artist-uid", {
        artist: "Managed Artist",
        phone: "802-555-1212",
        email: "artist@example.com",
        bio: "Managed bio",
        web: "https://artist.example.com",
        fb: "https://facebook.example.com/artist",
        youtube: "https://youtube.example.com/artist",
        insta: "https://instagram.example.com/artist",
        spotify: "https://spotify.example.com/artist",
        picUrl: "https://storage.example.com/profile.jpg",
      }),
      doc("empty-artist", {}),
    ];
    firebase.docsByCollection.donors = [doc("donor-1", { name: "Alice Donor" })];

    const { container } = render(<AdminPortal />);

    expect(await screen.findByRole("button", { name: "Edit Shows" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Admin Show" })).toBeInTheDocument();

    expect(container.querySelector('input[name="splash-img"]')).toHaveAttribute(
      "accept",
      "image/*"
    );
    expect(
      screen.getAllByRole("button", { name: /Upload image to the Database/i })[0]
    ).toBeDisabled();

    await user.selectOptions(container.querySelector("select"), "booked");
    expect(screen.getByRole("heading", { name: "Admin Show" })).toBeInTheDocument();
    await user.selectOptions(container.querySelectorAll("select")[1], "archived");
    await user.clear(container.querySelector('input[name="blurb"]'));
    await user.type(container.querySelector('input[name="blurb"]'), "Updated public blurb");
    await user.clear(container.querySelector('input[name="title"]'));
    await user.type(container.querySelector('input[name="title"]'), "Updated Admin Show");
    await user.clear(container.querySelector('input[name="contact"]'));
    await user.type(container.querySelector('input[name="contact"]'), "Updated Producer");
    await user.clear(container.querySelector('input[name="type"]'));
    await user.type(container.querySelector('input[name="type"]'), "Updated Music");

    await user.click(screen.getByRole("button", { name: "Add a new Show Time" }));
    await user.clear(container.querySelector('input[name="date-time"]'));
    await user.type(container.querySelector('input[name="date-time"]'), "2099-06-02T19:30");
    await user.clear(container.querySelector('input[name="ticket-link"]'));
    await user.type(container.querySelector('input[name="ticket-link"]'), "https://tickets.example.com/new");
    await user.click(container.querySelector('input[name="sold-out"]'));
    await user.click(screen.getAllByRole("button", { name: "Confirm Show Time" })[0]);

    await user.upload(
      container.querySelector('input[name="splash-img"]'),
      new File(["cover"], "admin cover.jpg", { type: "image/jpeg" })
    );
    await user.click(screen.getAllByRole("button", { name: /Upload image to the Database/i })[0]);
    await user.upload(
      container.querySelector('input[name="img-2"]'),
      new File(["second"], "admin second.jpg", { type: "image/jpeg" })
    );
    await user.click(screen.getAllByRole("button", { name: /Upload image to the Database/i })[1]);
    await user.upload(
      container.querySelector('input[name="img-3"]'),
      new File(["third"], "admin third.jpg", { type: "image/jpeg" })
    );
    await user.click(screen.getAllByRole("button", { name: /Upload image to the Database/i })[2]);
    await waitFor(() => {
      expect(firebase.getDownloadURL).toHaveBeenCalledTimes(3);
    });

    await user.click(screen.getByRole("button", { name: "Submit show details" }));
    await waitFor(() => {
      expect(firebase.setDoc).toHaveBeenCalledWith(
        { name: "shows", id: "show-1" },
        expect.objectContaining({
          title: "Updated Admin Show",
          type: "Updated Music",
          blurb: "Updated public blurb",
          contactName: "Updated Producer",
          status: "archived",
          dates: expect.arrayContaining([
            expect.objectContaining({
              ticketLink: "https://tickets.example.com/new",
              soldOut: true,
            }),
          ]),
          imageLg: "https://storage.example.com/image.jpg",
          image2: "https://storage.example.com/image.jpg",
          image3: "https://storage.example.com/image.jpg",
        })
      );
    });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(firebase.deleteDoc).toHaveBeenCalledWith({ name: "donors", id: "donor-1" });
    });

    await user.type(container.querySelector('input[name="add-donor"]'), "New Donor");
    await user.click(screen.getByRole("button", { name: "Add Donor" }));
    await waitFor(() => {
      expect(firebase.setDoc).toHaveBeenCalledWith(
        { name: "donors", id: "generated-id" },
        { name: "New Donor", id: "generated-id" }
      );
    });

    await user.click(screen.getByRole("button", { name: "Edit Artist Profiles" }));
    expect(await screen.findByRole("heading", { name: "Managed Artist" })).toBeInTheDocument();
    await user.upload(
      container.querySelector('input[name="splash-img"]'),
      new File(["profile"], "managed profile.jpg", { type: "image/jpeg" })
    );
    await user.click(screen.getAllByRole("button", { name: /Upload your image/i })[0]);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Image uploaded to Database");
    });
    await user.clear(container.querySelector('input[name="artist"]'));
    await user.type(container.querySelector('input[name="artist"]'), "Updated Managed Artist");
    await user.clear(container.querySelector('input[name="phone"]'));
    await user.type(container.querySelector('input[name="phone"]'), "802-555-9999");
    await user.clear(container.querySelector('input[name="email"]'));
    await user.type(container.querySelector('input[name="email"]'), "managed-updated@example.com");
    await user.clear(container.querySelector('input[name="bio"]'));
    await user.type(container.querySelector('input[name="bio"]'), "Updated managed bio");
    await user.clear(container.querySelector('input[name="website"]'));
    await user.type(container.querySelector('input[name="website"]'), "https://managed.example.com");
    await user.clear(container.querySelector('input[name="fb"]'));
    await user.type(container.querySelector('input[name="fb"]'), "https://facebook.example.com/managed");
    await user.clear(container.querySelector('input[name="insta"]'));
    await user.type(container.querySelector('input[name="insta"]'), "https://instagram.example.com/managed");
    await user.clear(container.querySelector('input[name="spotify"]'));
    await user.type(container.querySelector('input[name="spotify"]'), "https://spotify.example.com/managed");
    await user.clear(container.querySelector('input[name="youtube"]'));
    await user.type(container.querySelector('input[name="youtube"]'), "https://youtube.example.com/managed");
    await user.click(screen.getAllByRole("button", { name: "Update artist information" })[0]);

    await waitFor(() => {
      expect(firebase.updateDoc).toHaveBeenCalledWith(
        { name: "artists", id: "artist-uid" },
        expect.objectContaining({
          artist: "Updated Managed Artist",
          phone: "802-555-9999",
          email: "managed-updated@example.com",
          bio: "Updated managed bio",
          web: "https://managed.example.com",
          fb: "https://facebook.example.com/managed",
          insta: "https://instagram.example.com/managed",
          spotify: "https://spotify.example.com/managed",
          youtube: "https://youtube.example.com/managed",
          picUrl: "https://storage.example.com/image.jpg",
        })
      );
    });

    await user.click(screen.getByRole("button", { name: "Edit Shows" }));
    expect(await screen.findByRole("heading", { name: "Admin Show" })).toBeInTheDocument();
  });

  test("admin portal logs loading failures and fails closed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    firebase.auth.currentUser = { uid: "admin-uid", email: "admin@example.com" };
    firebase.getDoc.mockRejectedValue(new Error("admin lookup failed"));
    firebase.getDocs.mockRejectedValue(new Error("collection load failed"));

    render(<AdminPortal />);

    expect(await screen.findByRole("heading", { name: "403: Forbidden" })).toBeInTheDocument();
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("admin lookup failed");
      expect(console.error).toHaveBeenCalledWith("collection load failed");
    });
  });
});
