import type { MetadataRoute } from "next";
import { getSiteMetadataBase } from "@/lib/site-metadata-base";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteMetadataBase();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/settings", "/submit", "/admin", "/auth/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
