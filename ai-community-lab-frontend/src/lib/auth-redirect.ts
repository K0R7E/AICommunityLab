/**
 * Origin used for OAuth `redirectTo`. Safari (and some clients) block
 * navigating to http://0.0.0.0 — Docker/Next often print "Network: 0.0.0.0:3000"
 * but the app must use localhost in the browser and in Supabase redirect URLs.
 */
export function getOAuthRedirectBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const { protocol, hostname, port } = window.location;
  if (hostname === "0.0.0.0") {
    const p = port || "3000";
    return `${protocol}//localhost:${p}`;
  }
  return window.location.origin;
}
