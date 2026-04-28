import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canonicalSiteOrigin } from "@/lib/canonical-origin";

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

  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  // @supabase/ssr sometimes misses chunked cookie variants (sb-*-auth-token.0,
  // .1, …). Explicitly expire every matching cookie so the browser is fully
  // signed out regardless of chunk count.
  request.cookies.getAll()
    .filter((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))
    .forEach((c) => {
      response.cookies.set(c.name, "", {
        maxAge: 0,
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    });

  return response;
}
