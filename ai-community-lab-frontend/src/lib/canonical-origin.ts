/**
 * Docker / some setups use Host 0.0.0.0 — browsers cannot follow that. Use localhost
 * for redirects so OAuth completion lands on a real origin.
 */
export function canonicalSiteOrigin(url: URL): string {
  if (url.hostname === "0.0.0.0") {
    return `${url.protocol}//localhost${url.port ? `:${url.port}` : ""}`;
  }
  return url.origin;
}
