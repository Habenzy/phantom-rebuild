import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import About from "../pages/about/About";

describe("About page", () => {
  test("renders venue, mission, board, director, and contact details", () => {
    render(<About />);

    expect(screen.getByRole("heading", { name: "About Us" })).toBeInTheDocument();
    expect(screen.getByText(/Phantom Theater was created in Warren/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "THE EDGCOMB BARN" })).toBeInTheDocument();
    expect(screen.getByText(/BOARD OF DIRECTORS/i)).toBeInTheDocument();
    expect(screen.getByText(/ARTISTIC DIRECTOR: Tracy Martin/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Tracy Martin" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contact Us" })).toBeInTheDocument();
    expect(screen.getByText(/BOX 416 WARREN, VT 05674/i)).toBeInTheDocument();
  });
});
