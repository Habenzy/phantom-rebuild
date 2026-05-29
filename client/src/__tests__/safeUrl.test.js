import { describe, expect, test } from "vitest";
import {
  FALLBACK_TICKET_URL,
  safeExternalUrl,
  safeOptionalUrl,
  safeTicketUrl,
} from "../utils/safeUrl";

describe("safeUrl", () => {
  test("allows absolute https URLs", () => {
    expect(safeExternalUrl("https://tickets.example.com/show")).toBe(
      "https://tickets.example.com/show"
    );
  });

  test("rejects javascript, data, relative, protocol-relative, and http URLs", () => {
    expect(safeTicketUrl("javascript:alert(1)")).toBe(FALLBACK_TICKET_URL);
    expect(safeTicketUrl("data:text/html,<script>alert(1)</script>")).toBe(
      FALLBACK_TICKET_URL
    );
    expect(safeTicketUrl("/local/path")).toBe(FALLBACK_TICKET_URL);
    expect(safeTicketUrl("//evil.example.com/path")).toBe(FALLBACK_TICKET_URL);
    expect(safeTicketUrl("http://tickets.example.com/show")).toBe(FALLBACK_TICKET_URL);
  });

  test("trims safe URLs and returns empty string for absent optional URLs", () => {
    expect(safeOptionalUrl("  https://artist.example.com/bio  ")).toBe(
      "https://artist.example.com/bio"
    );
    expect(safeOptionalUrl("")).toBe("");
    expect(safeOptionalUrl(undefined)).toBe("");
  });

  test("supports exact host allowlists", () => {
    const allowedHosts = new Set(["paypal.com", "www.paypal.com"]);

    expect(
      safeExternalUrl("https://www.paypal.com/donate", "", { allowedHosts })
    ).toBe("https://www.paypal.com/donate");
    expect(
      safeExternalUrl("https://paypal.attacker.example/donate", "", {
        allowedHosts,
      })
    ).toBe("");
  });
});
