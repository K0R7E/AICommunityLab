import { NextResponse, type NextRequest } from "next/server";
import { CSRF_COOKIE_NAME } from "@/lib/csrf-constants";

export async function GET(request: NextRequest) {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value?.trim();
  const token = existing || crypto.randomUUID();
  const response = NextResponse.json({ ok: true });

  if (!existing) {
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: token,
      // Not httpOnly: the double-submit pattern requires JS to read this value
      // and echo it back as a request header. httpOnly would prevent that without
      // any security benefit — CSRF tokens do not need to be secret from the
      // page's own JS, only from cross-origin scripts (enforced by SameSite=strict).
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  }

  return response;
}
