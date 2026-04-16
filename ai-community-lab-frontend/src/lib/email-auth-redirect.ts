/** Client-side origin for Supabase emailRedirectTo (must match Dashboard allowlist). */
export function getEmailAuthRedirectOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (hostname === "0.0.0.0") {
      const p = port || "3000";
      return `${protocol}//localhost:${p}`;
    }
    return window.location.origin;
  }
  return "";
}
