import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canonicalSiteOrigin } from "@/lib/canonical-origin";

/**
 * OAuth returns with ?code= — exchange for session. Session cookies must be set on
 * this redirect response. Origin must be localhost, not 0.0.0.0 (Safari / Docker).
 */
export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const origin = canonicalSiteOrigin(reqUrl);

  const code = reqUrl.searchParams.get("code");
  const nextParam = reqUrl.searchParams.get("next") ?? "/";
  const safeNext = nextParam.startsWith("/") ? nextParam : "/";

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/?error=auth&message=${encodeURIComponent(error.message)}`,
        origin,
      ),
    );
  }

  return response;
}
