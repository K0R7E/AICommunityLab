/**
 * Prefer `NEXT_PUBLIC_SITE_URL` (origin only) so redirects are not driven by
 * untrusted `Host` when behind proxies. Falls back to the request URL.
 *
 * Docker / some setups use Host 0.0.0.0 — browsers cannot follow that. Use localhost
 * for redirects so OAuth completion lands on a real origin.
 */
export function canonicalSiteOrigin(url: URL): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }
  if (url.hostname === "0.0.0.0") {
    return `${url.protocol}//localhost${url.port ? `:${url.port}` : ""}`;
  }
  return url.origin;
}
