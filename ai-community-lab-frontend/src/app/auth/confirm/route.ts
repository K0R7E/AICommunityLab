import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { canonicalSiteOrigin } from "@/lib/canonical-origin";
import { safeRelativeNextPath } from "@/lib/safe-next-path";

/**
 * Email confirmation / magic-link style OTP: Supabase redirects here with
 * token_hash + type (signup, recovery, etc.).
 */
export async function GET(request: NextRequest) {
  const reqUrl = new URL(request.url);
  const origin = canonicalSiteOrigin(reqUrl);

  const token_hash = reqUrl.searchParams.get("token_hash");
  const type = reqUrl.searchParams.get("type") as EmailOtpType | null;
  const nextParam = reqUrl.searchParams.get("next") ?? "/";
  const safeNext = safeRelativeNextPath(nextParam);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey || !token_hash || !type) {
    return NextResponse.redirect(new URL("/login?error=confirm", origin));
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

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=confirm", origin));
  }

  return response;
}
