/**
 * Server-side canonical origin for sitemap, robots, and metadataBase.
 * Prefer NEXT_PUBLIC_SITE_URL in production (see .env.example).
 */
export function getSiteMetadataBase(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    try {
      return new URL(host).origin;
    } catch {
      /* fall through */
    }
  }
  return "http://localhost:3000";
}
