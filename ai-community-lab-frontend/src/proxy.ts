import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeRelativeNextPath } from "@/lib/safe-next-path";

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64");
}

function parseEnvOrigin(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function buildCspWithNonce(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const connectSources = new Set<string>(["'self'"]);
  const supabaseOrigin = parseEnvOrigin("NEXT_PUBLIC_SUPABASE_URL");
  if (supabaseOrigin) {
    connectSources.add(supabaseOrigin);
    const { host, protocol } = new URL(supabaseOrigin);
    if (protocol === "https:") {
      connectSources.add(`wss://${host}`);
    }
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    // 'strict-dynamic' lets scripts loaded by a nonced script inherit trust
    // (needed for Next.js's lazy chunk loading). In dev, React also needs
    // 'unsafe-eval' for its enhanced error stack reconstruction.
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // In production the nonce replaces 'unsafe-inline' for styles.
    // In dev, Next.js fast-refresh injects style tags without nonces so we
    // fall back to 'unsafe-inline' only there.
    isDev
      ? "style-src 'self' 'unsafe-inline'"
      : `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${Array.from(connectSources).join(" ")}`,
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

function isCspReportOnly(): boolean {
  return process.env.CSP_REPORT_ONLY?.trim().toLowerCase() === "true";
}

/**
 * Creates a pass-through NextResponse that forwards the CSP nonce to Next.js.
 *
 * Sets `x-nonce` and `Content-Security-Policy` on the outgoing *request*
 * headers so Next.js can automatically stamp the nonce on its own injected
 * framework scripts, page bundles, and inline styles during SSR.
 * Also sets the CSP header on the *response* so the browser enforces it.
 *
 * Note: we always forward the canonical `Content-Security-Policy` header (not
 * the report-only variant) on the request side — Next.js only parses the
 * canonical name when extracting the nonce.
 */
function withNonce(
  request: NextRequest,
  nonce: string,
  cspKey: string,
  cspValue: string,
): NextResponse {
  const h = new Headers(request.headers);
  h.set("x-nonce", nonce);
  h.set("Content-Security-Policy", cspValue);
  const res = NextResponse.next({ request: { headers: h } });
  res.headers.set(cspKey, cspValue);
  return res;
}

/**
 * Routes that are accessible without being signed in.
 * Everything else requires authentication (opt-out model).
 */
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/login/forgot-password",
  "/terms",
  "/privacy",
]);

/**
 * Paths that signed-in users without an accepted Terms/Privacy record may
 * still reach. Everything else redirects them to `/welcome`. Order matters
 * only for readability — matching is by exact path or `${prefix}/...`.
 *
 * - `/welcome` is the gate page itself.
 * - `/privacy` and `/terms` must be reachable from the gate (links).
 * - `/auth/...` covers the OAuth callback, email confirm, and sign-out.
 * - `/login` lets users restart the OAuth flow if needed.
 */
const TERMS_GATE_ALLOWED_PATHS = [
  "/welcome",
  "/privacy",
  "/terms",
  "/auth",
  "/login",
] as const;

function isPublicPath(path: string): boolean {
  if (PUBLIC_PATHS.has(path)) return true;
  // OAuth callbacks and sign-out live under /auth
  if (path.startsWith("/auth/")) return true;
  return false;
}

function isTermsGateAllowedPath(path: string): boolean {
  return TERMS_GATE_ALLOWED_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

/**
 * The terms gate only fires for top-level page navigations (and RSC fetches
 * for those navigations). We deliberately skip:
 *   - non-GET requests (server actions, route handlers — those guard
 *     themselves, see `acceptTerms` and the data-write actions in actions.ts)
 *   - `/api/*` (route handlers serve their own auth)
 *   - `/_next/*` (already excluded by the matcher, but kept for safety)
 */
function shouldRunTermsGate(request: NextRequest, path: string): boolean {
  if (request.method !== "GET") return false;
  if (path.startsWith("/api/")) return false;
  if (path.startsWith("/_next/")) return false;
  return true;
}

/**
 * Fast anonymous-user check. Supabase SSR stores auth state in cookies named
 * `sb-<project-ref>-auth-token` (and chunked variants). If no such cookie is
 * present, the visitor is definitely signed out and we can skip Supabase
 * altogether — saving a `getUser()` round-trip on every public page load.
 */
function hasSupabaseAuthCookie(request: NextRequest): boolean {
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith("sb-") && c.name.includes("-auth-token")) {
      return true;
    }
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const rawPathname = request.nextUrl.pathname;

  // Normalize percent-encoded path segments (e.g. /%61dmin → /admin).
  // Guards: decoded result must still be a safe single-slash-rooted path.
  // %2F decodes to "/" which would produce "//host" — open redirect — so we
  // reject anything that decodes to a path starting with "//".
  try {
    const decoded = decodeURIComponent(rawPathname);
    if (decoded !== rawPathname) {
      if (!decoded.startsWith("/") || decoded.startsWith("//")) {
        return new NextResponse("Bad Request", { status: 400 });
      }
      const url = request.nextUrl.clone();
      url.pathname = decoded;
      return NextResponse.redirect(url, 308);
    }
  } catch {
    // Malformed percent-encoding (e.g. %GG) — reject immediately.
    return new NextResponse("Bad Request", { status: 400 });
  }

  const path = rawPathname;
  const nonce = generateNonce();
  const cspKey = isCspReportOnly()
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";
  const cspValue = buildCspWithNonce(nonce);

  const publicPath = isPublicPath(path);
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (!publicPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("error", "config");
      url.searchParams.set(
        "next",
        safeRelativeNextPath(`${path}${request.nextUrl.search}`),
      );
      const res = NextResponse.redirect(url);
      res.headers.set(cspKey, cspValue);
      return res;
    }
    return withNonce(request, nonce, cspKey, cspValue);
  }

  // The terms gate only matters for signed-in users — anonymous visitors
  // can't have accepted yet, so we apply the gate logic only when an auth
  // cookie is present. Without this short-circuit, every public page load
  // would trigger a Supabase `getUser()` round-trip.
  const gateApplies =
    hasAuthCookie &&
    !isTermsGateAllowedPath(path) &&
    shouldRunTermsGate(request, path);

  // Fast path: public page + no auth cookie → definitely anonymous, no
  // Supabase call needed (terms gate can't apply without a session).
  if (publicPath && !hasAuthCookie) {
    return withNonce(request, nonce, cspKey, cspValue);
  }

  let supabaseResponse = withNonce(request, nonce, cspKey, cspValue);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Rebuild headers from the now-mutated request (updated cookies) and
        // re-attach the nonce so Next.js keeps stamping it on injected tags.
        const h = new Headers(request.headers);
        h.set("x-nonce", nonce);
        h.set("Content-Security-Policy", cspValue);
        supabaseResponse = NextResponse.next({ request: { headers: h } });
        supabaseResponse.headers.set(cspKey, cspValue);
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (!publicPath) {
      // Opt-out model: every non-public page requires authentication.
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set(
        "next",
        safeRelativeNextPath(`${path}${request.nextUrl.search}`),
      );
      const res = NextResponse.redirect(url);
      res.headers.set(cspKey, cspValue);
      return res;
    }
    // Anonymous visitor on a public page — terms gate doesn't apply,
    // so just pass through with the (already-set) CSP headers.
    return supabaseResponse;
  }

  // Signed-in user: enforce the first-login consent gate. The gate fires for
  // every non-allowlisted page navigation until `has_accepted_terms = true`.
  if (gateApplies) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("has_accepted_terms")
      .eq("id", user.id)
      .maybeSingle<{ has_accepted_terms?: boolean | null }>();

    if (profileRow?.has_accepted_terms !== true) {
      const url = request.nextUrl.clone();
      url.pathname = "/welcome";
      url.search = "";
      url.searchParams.set(
        "next",
        safeRelativeNextPath(`${path}${request.nextUrl.search}`),
      );
      const res = NextResponse.redirect(url);
      res.headers.set(cspKey, cspValue);
      return res;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // All routes except Next.js internals and static assets.
    // This ensures every HTML response gets a fresh CSP nonce.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
