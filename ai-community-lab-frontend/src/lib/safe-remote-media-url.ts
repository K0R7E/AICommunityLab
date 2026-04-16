/**
 * Remote images in <img src> — restrict to https to avoid mixed content and
 * obvious non-HTTP schemes; does not fully mitigate malicious SVG/CDN abuse.
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
    return { href: u.href, label: s.replace(/^https?:\/\//, "") };
  } catch {
    return null;
  }
}
