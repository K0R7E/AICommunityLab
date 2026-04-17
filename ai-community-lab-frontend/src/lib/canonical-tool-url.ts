/**
 * Normalized URL key for duplicate detection (same rules should match DB trigger
 * in migration 015, if extended there later).
 */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "mc_eid",
  "msclkid",
  "_ga",
  "ref",
]);

function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

/**
 * Returns null when there is no usable URL; otherwise a stable https string
 * for equality / unique-index checks.
 */
export function canonicalToolUrl(raw: string | null | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.protocol = "https:";
    u.hostname = stripWww(u.hostname);
    if (
      (u.hostname === "localhost" || u.hostname === "127.0.0.1") &&
      u.port
    ) {
      /* keep port for local dev */
    } else {
      u.port = "";
    }
    let pathname = u.pathname || "/";
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    u.pathname = pathname || "/";

    const keys = [...u.searchParams.keys()].filter((k) => !TRACKING_PARAMS.has(k.toLowerCase()));
    keys.sort((a, b) => a.localeCompare(b));
    const next = new URLSearchParams();
    for (const k of keys) {
      const v = u.searchParams.getAll(k);
      for (const item of v) next.append(k, item);
    }
    u.search = next.toString() ? `?${next.toString()}` : "";

    u.hash = "";
    return u.href;
  } catch {
    return null;
  }
}
