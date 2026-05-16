export const FALLBACK_TICKET_URL = "https://theaterengine.com/companies/1";

const DEFAULT_ALLOWED_PROTOCOLS = new Set(["https:"]);

function hasControlCharacter(value) {
  return Array.from(value).some((char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

export function safeExternalUrl(value, fallback = "", options = {}) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.startsWith("//") || hasControlCharacter(trimmed)) {
    return fallback;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return fallback;
  }

  const allowedProtocols = options.allowedProtocols || DEFAULT_ALLOWED_PROTOCOLS;
  if (!allowedProtocols.has(parsed.protocol)) {
    return fallback;
  }

  if (options.allowedHosts) {
    const host = parsed.hostname.toLowerCase();
    if (!options.allowedHosts.has(host)) {
      return fallback;
    }
  }

  return trimmed;
}

export function safeTicketUrl(value) {
  return safeExternalUrl(value, FALLBACK_TICKET_URL);
}

export function safeOptionalUrl(value) {
  return safeExternalUrl(value, "");
}
