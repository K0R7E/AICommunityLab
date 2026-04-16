/**
 * Origin used for OAuth `redirectTo`. Prefer `NEXT_PUBLIC_SITE_URL` in production
 * so the callback matches Supabase allowlist. Safari blocks 0.0.0.0 — use localhost.
 */
export function getOAuthRedirectBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }
  const { protocol, hostname, port } = window.location;
  if (hostname === "0.0.0.0") {
    const p = port || "3000";
    return `${protocol}//localhost:${p}`;
  }
  return window.location.origin;
}
