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
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${Array.from(connectSources).join(" ")}`,
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

function isCspReportOnly(): boolean {
  return process.env.CSP_REPORT_ONLY?.trim().toLowerCase() !== "false";
}

const PROTECTED_PATHS = ["/submit", "/settings", "/admin", "/notifications"];

function isProtected(path: string): boolean {
  return PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const rawPathname = request.nextUrl.pathname;

  // Redirect percent-encoded path segments to their decoded form.
  // Prevents routing to 500 on paths like /%61dmin and blocks bypass attempts.
  try {
    const decoded = decodeURIComponent(rawPathname);
    if (decoded !== rawPathname) {
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (isProtected(path)) {
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
    const res = NextResponse.next({ request });
    res.headers.set(cspKey, cspValue);
    return res;
  }

  // getUser() is expensive — only call it for protected routes.
  if (!isProtected(path)) {
    const res = NextResponse.next({ request });
    res.headers.set(cspKey, cspValue);
    return res;
  }

  let supabaseResponse = NextResponse.next({ request });
  supabaseResponse.headers.set(cspKey, cspValue);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
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

  return supabaseResponse;
}

export const config = {
  matcher: [
    // All routes except Next.js internals and static assets.
    // This ensures every HTML response gets a fresh CSP nonce.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
