import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { POST_MODERATION_PUBLISHED } from "@/lib/moderation";
import { getSiteMetadataBase } from "@/lib/site-metadata-base";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteMetadataBase();
  const entries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select("id, created_at")
      .eq("moderation_status", POST_MODERATION_PUBLISHED)
      .order("created_at", { ascending: false });

    for (const row of data ?? []) {
      const id = (row as { id: string }).id;
      const createdAt = (row as { created_at: string }).created_at;
      entries.push({
        url: `${base}/post/${id}`,
        lastModified: new Date(createdAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    /* return home-only sitemap if DB unavailable at build time */
  }

  return entries;
}
