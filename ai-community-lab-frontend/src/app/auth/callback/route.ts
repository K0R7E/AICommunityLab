import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canonicalSiteOrigin } from "@/lib/canonical-origin";
import { safeRelativeNextPath } from "@/lib/safe-next-path";
import { logUserActivity, getClientIp } from "@/lib/user-activity-logger";

/**
 * OAuth returns with ?code= — exchange for session. Session cookies must be set on
 * this redirect response. Origin must be localhost, not 0.0.0.0 (Safari / Docker).
 */
export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const origin = canonicalSiteOrigin(reqUrl);

  const code = reqUrl.searchParams.get("code");
  const nextParam = reqUrl.searchParams.get("next") ?? "/";
  const safeNext = safeRelativeNextPath(nextParam);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL("/?error=auth", origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=auth", origin));
  }

  const redirectTarget = new URL(safeNext, origin);
  const response = NextResponse.redirect(redirectTarget);

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

  const { data: exchangeData, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/?error=auth", origin));
  }

  // Skip the proxy bounce for first-time users by checking the consent flag
  // here and redirecting straight to /welcome. The proxy is still the
  // authoritative gate — this is just a UX optimization to avoid a hop
  // through `safeNext` first.
  const userId = exchangeData?.user?.id;
  if (userId) {
    void logUserActivity(userId, "login", undefined, getClientIp(request));
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("has_accepted_terms")
      .eq("id", userId)
      .maybeSingle<{ has_accepted_terms?: boolean | null }>();

    if (profileRow?.has_accepted_terms !== true) {
      const welcomeUrl = new URL("/welcome", origin);
      welcomeUrl.searchParams.set("next", safeNext);
      const welcomeResponse = NextResponse.redirect(welcomeUrl);
      // Carry over any cookies the Supabase client set during the exchange.
      response.cookies.getAll().forEach((cookie) => {
        welcomeResponse.cookies.set(cookie);
      });
      return welcomeResponse;
    }
  }

  return response;
}
