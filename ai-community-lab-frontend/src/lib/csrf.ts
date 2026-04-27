import type { NextRequest } from "next/server";
import { canonicalSiteOrigin } from "@/lib/canonical-origin";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf-constants";

export function isCrossSiteRequest(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "same-site") {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin !== canonicalSiteOrigin(request.nextUrl);
}

export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value?.trim();
  const headerToken = request.headers.get(CSRF_HEADER_NAME)?.trim();

  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}
