import { createClient } from "@/lib/supabase/server";
import { POST_MODERATION_PUBLISHED } from "@/lib/moderation";
import { getSiteMetadataBase } from "@/lib/site-metadata-base";

export const dynamic = "force-dynamic";

const FEED_LIMIT = 100;

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const base = getSiteMetadataBase();
  const now = new Date();
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, description, created_at")
    .eq("moderation_status", POST_MODERATION_PUBLISHED)
    .order("created_at", { ascending: false })
    .limit(FEED_LIMIT);

  const items = (data ??
    []) as {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
  }[];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AICommunityLab</title>
    <link>${xmlEscape(base)}</link>
    <description>Latest published AI tools from the AICommunityLab community feed.</description>
    <language>en</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(`${base}/feed.xml`)}" rel="self" type="application/rss+xml" />
${items
  .map((post) => {
    const postUrl = `${base}/post/${post.id}`;
    const description = post.description?.trim() || "View tool details on AICommunityLab.";
    return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(postUrl)}</link>
      <guid isPermaLink="true">${xmlEscape(postUrl)}</guid>
      <description>${xmlEscape(description)}</description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
    </item>`;
  })
  .join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
