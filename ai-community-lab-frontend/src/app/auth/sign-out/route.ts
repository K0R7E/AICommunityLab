import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canonicalSiteOrigin } from "@/lib/canonical-origin";
import { logUserActivity, getClientIp } from "@/lib/user-activity-logger";
function isCrossSiteRequest(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "same-site") {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin !== canonicalSiteOrigin(request.nextUrl);
}

/**
 * Clears Supabase auth cookies on the response. Client-only signOut() often
 * leaves SSR cookies, so the app still looks signed in until a hard refresh.
 */
export async function POST(request: NextRequest) {
  if (isCrossSiteRequest(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  // Collect cookies written by the Supabase client so we can replay them onto
  // whichever response object we end up returning (success or error).
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  const { data: { user: signingOutUser } } = await supabase.auth.getUser();
  const { error } = await supabase.auth.signOut();

  // Build the final response — we decide success vs error here so cookies can
  // be attached to the *actual* response object that gets returned.
  const response = NextResponse.json(
    error ? { ok: false, error: error.message } : { ok: true },
    { status: error ? 400 : 200 },
  );

  // Apply Supabase-generated cookie mutations (clears the session tokens).
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  // @supabase/ssr sometimes misses chunked cookie variants (sb-*-auth-token.0,
  // .1, …). Explicitly expire every matching cookie so the browser is fully
  // signed out regardless of chunk count.
  const clearOpts = {
    maxAge: 0,
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  request.cookies.getAll()
    .filter((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))
    .forEach((c) => response.cookies.set(c.name, "", clearOpts));

  if (!error && signingOutUser) {
    void logUserActivity(signingOutUser.id, "logout", undefined, getClientIp(request));
  }

  return response;
}
