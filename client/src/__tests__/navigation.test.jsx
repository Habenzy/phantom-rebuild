import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import Burger from "../sections/nav_bar/Burger";
import Nav from "../sections/nav_bar/Nav";
import Footer from "../sections/footer/Footer";

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("navigation components", () => {
  test("desktop nav exposes the public page links", () => {
    renderWithRouter(<Nav />);

    const nav = screen.getByRole("navigation");

    expect(within(nav).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/About"
    );
    expect(within(nav).getByRole("link", { name: "Donate" })).toHaveAttribute(
      "href",
      "/Donate"
    );
    expect(within(nav).getByRole("link", { name: "Season" })).toHaveAttribute(
      "href",
      "/Season"
    );
    expect(within(nav).getByRole("link", { name: "Artists" })).toHaveAttribute(
      "href",
      "/Artists"
    );
  });

  test("burger nav opens and closes after selecting a route", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Burger />);

    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Season" })).toHaveAttribute(
      "href",
      "/Season"
    );

    await user.click(screen.getByRole("link", { name: "Season" }));

    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
  });

  test("footer exposes social, donation, artist, and admin links", () => {
    const { container } = renderWithRouter(<Footer />);

    expect(screen.getByRole("link", { name: /artist profile/i })).toHaveAttribute(
      "href",
      "/ArtistPortal"
    );
    expect(screen.getByRole("link", { name: /admin login/i })).toHaveAttribute(
      "href",
      "/adminDash"
    );
    expect(container.querySelector('a[href*="facebook.com"]')).toHaveAttribute(
      "rel",
      "noreferrer noopener"
    );
    expect(container.querySelector('a[href*="instagram.com"]')).toHaveAttribute(
      "rel",
      "noreferrer noopener"
    );
    expect(screen.getByRole("button", { name: /donate with paypal/i })).toBeInTheDocument();
  });
});
