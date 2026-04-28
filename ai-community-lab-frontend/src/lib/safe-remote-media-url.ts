const PRIVATE_HOST_PREFIXES = [
  "localhost",
  "127.",
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
  "192.168.",
  "169.254.",
  "0.",
  "[::1]",
  "[fc",
  "[fd",
];

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return PRIVATE_HOST_PREFIXES.some((prefix) => h === prefix.replace(/\.$/, "") || h.startsWith(prefix));
}

/**
 * Remote images in <img src> — restrict to https to avoid mixed content,
 * obvious non-HTTP schemes, and SSRF via private/loopback addresses.
 */
export function safeHttpsImageUrl(
  raw: string | null | undefined,
): string | null {
  const s = raw?.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return null;
    if (!u.hostname) return null;
    if (isPrivateHost(u.hostname)) return null;
    return u.href;
  } catch {
    return null;
  }
}

/** Profile website link: only http(s), same rules as settings form. */
export function safeHttpWebsiteHref(
  raw: string | null | undefined,
): { href: string; label: string } | null {
  const s = raw?.trim();
  if (!s) return null;
  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname) return null;
    if (isPrivateHost(u.hostname)) return null;
    return { href: u.href, label: s.replace(/^https?:\/\//, "") };
  } catch {
    return null;
  }
}
