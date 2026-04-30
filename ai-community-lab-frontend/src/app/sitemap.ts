import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { POST_MODERATION_PUBLISHED } from "@/lib/moderation";
import { getSiteMetadataBase } from "@/lib/site-metadata-base";

export const revalidate = 3600; // regenerate at most once per hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteMetadataBase();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/news`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/users`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/security-policy`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();
    const [{ data: posts }, { data: profiles }] = await Promise.all([
      supabase
        .from("posts")
        .select("id, created_at")
        .eq("moderation_status", POST_MODERATION_PUBLISHED)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("username")
        .order("username", { ascending: true }),
    ]);

    // Use the most recent published post date as the home page lastModified
    staticPages[0].lastModified = posts?.[0]?.created_at
      ? new Date((posts[0] as { created_at: string }).created_at)
      : new Date();

    const postEntries: MetadataRoute.Sitemap = (posts ?? []).map((row) => ({
      url: `${base}/post/${(row as { id: string }).id}`,
      lastModified: new Date((row as { created_at: string }).created_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const profileEntries: MetadataRoute.Sitemap = (profiles ?? []).map((row) => ({
      url: `${base}/profile/${(row as { username: string }).username}`,
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    return [...staticPages, ...postEntries, ...profileEntries];
  } catch {
    /* return static-only sitemap if DB unavailable */
    return staticPages;
  }
}
