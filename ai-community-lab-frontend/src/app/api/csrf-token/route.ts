import { NextResponse, type NextRequest } from "next/server";
import { CSRF_COOKIE_NAME } from "@/lib/csrf-constants";

export async function GET(request: NextRequest) {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value?.trim();
  const token = existing || crypto.randomUUID();
  const response = NextResponse.json({ ok: true, csrfToken: token });

  if (!existing) {
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  }

  return response;
}
