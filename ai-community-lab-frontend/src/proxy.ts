import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeRelativeNextPath } from "@/lib/safe-next-path";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;

  if (!supabaseUrl || !supabaseKey) {
    if (
      path.startsWith("/submit") ||
      path.startsWith("/settings") ||
      path.startsWith("/admin") ||
      path.startsWith("/notifications")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("error", "config");
      const rawNext = `${request.nextUrl.pathname}${request.nextUrl.search}`;
      url.searchParams.set("next", safeRelativeNextPath(rawNext));
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    (path.startsWith("/submit") ||
      path.startsWith("/settings") ||
      path.startsWith("/admin") ||
      path.startsWith("/notifications"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set(
      "next",
      safeRelativeNextPath(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      ),
    );
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/submit",
    "/submit/:path*",
    "/settings",
    "/settings/:path*",
    "/admin",
    "/admin/:path*",
    "/notifications",
    "/notifications/:path*",
  ],
};
