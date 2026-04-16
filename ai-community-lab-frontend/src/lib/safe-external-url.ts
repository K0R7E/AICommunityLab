/**
 * Only allow http(s) URLs for user-controlled links (avoid javascript:, data:, etc.).
 */
export function safeHttpExternalUrl(raw: string | null | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (u.protocol === "http:" || u.protocol === "https:") {
      return u.href;
    }
  } catch {
    return null;
  }
  return null;
}

export function safeHttpExternalLink(
  raw: string | null | undefined,
): { href: string; label: string } | null {
  const href = safeHttpExternalUrl(raw);
  if (!href) return null;
  try {
    const label = new URL(href).hostname.replace(/^www\./, "");
    return { href, label };
  } catch {
    return { href, label: href };
  }
}
