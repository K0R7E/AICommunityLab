import type { MetadataRoute } from "next";
import { getSiteMetadataBase } from "@/lib/site-metadata-base";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteMetadataBase();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/auth",
          "/debug",
          "/notifications",
          "/settings",
          "/submit",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
