import { NextResponse } from "next/server";
import { getSiteMetadataBase } from "@/lib/site-metadata-base";

// Dynamic Route Handler instead of the robots.ts metadata route so that
// Vercel serves this through the Next.js runtime rather than the CDN static
// layer. The CDN automatically adds Access-Control-Allow-Origin: * to all
// statically generated metadata routes; a dynamic handler bypasses that.
export const dynamic = "force-dynamic";

export function GET() {
  const base = getSiteMetadataBase();
  const body = [
    "User-Agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api",
    "Disallow: /auth",
    "Disallow: /debug",
    "Disallow: /notifications",
    "Disallow: /settings",
    "Disallow: /submit",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
