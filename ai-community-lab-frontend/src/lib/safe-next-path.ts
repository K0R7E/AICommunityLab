/**
 * OAuth / post-login `next` must stay same-origin. Rejects scheme-relative URLs
 * (`//evil.com/...`), protocol injection, newlines, and other redirect tricks.
 */
const PATH_CHECK_BASE = "https://__next_path_check__.invalid";
const ALLOWED_NEXT_PREFIXES = [
  "/",
  "/admin",
  "/news",
  "/notifications",
  "/post",
  "/privacy",
  "/profile",
  "/settings",
  "/submit",
  "/terms",
] as const;

function isWhitelistedNextPath(pathname: string): boolean {
  return ALLOWED_NEXT_PREFIXES.some((prefix) =>
    prefix === "/"
      ? pathname === "/"
      : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function safeRelativeNextPath(raw: string): string {
  const s = raw.trim();
  if (!s || s.length > 2048) return "/";
  if (!s.startsWith("/")) return "/";
  if (s.startsWith("//")) return "/";
  if (s.includes("://")) return "/";
  if (s.includes("\\")) return "/";
  if (/[\n\r\0]/.test(s)) return "/";

  try {
    const resolved = new URL(s, PATH_CHECK_BASE);
    if (resolved.origin !== new URL(PATH_CHECK_BASE).origin) {
      return "/";
    }
    if (!isWhitelistedNextPath(resolved.pathname)) return "/";
    const out =
      resolved.pathname + resolved.search + resolved.hash || "/";
    if (!out.startsWith("/")) return "/";
    return out;
  } catch {
    return "/";
  }
}
