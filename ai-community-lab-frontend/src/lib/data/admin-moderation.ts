import { createClient } from "@/lib/supabase/server";
import { escapeLikePattern } from "@/lib/search-utils";

const POST_FIELDS =
  "id, title, url, description, categories, image_url, moderation_status, created_at, user_id" as const;

export type AdminModerationPost = {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  categories: string[];
  image_url: string | null;
  moderation_status: string;
  created_at: string;
  user_id: string;
};

export type AdminModerationComment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_id: string;
};

export async function getAdminModerationData(options: {
  q: string | null;
}): Promise<{ posts: AdminModerationPost[]; comments: AdminModerationComment[] }> {
  const supabase = await createClient();
  const term = options.q?.trim() || null;

  if (!term) {
    const [{ data: recentPosts }, { data: recentComments }] = await Promise.all([
      supabase
        .from("posts")
        .select(POST_FIELDS)
        .order("moderation_status", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("comments")
        .select("id, post_id, content, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(60),
    ]);
    return {
      posts: (recentPosts ?? []) as AdminModerationPost[],
      comments: (recentComments ?? []) as AdminModerationComment[],
    };
  }

  const pattern = `%${escapeLikePattern(term)}%`;
  const [{ data: byTitle }, { data: byDesc }, { data: byUrl }, { data: byComments }] =
    await Promise.all([
      supabase.from("posts").select(POST_FIELDS).ilike("title", pattern).limit(80),
      supabase.from("posts").select(POST_FIELDS).ilike("description", pattern).limit(80),
      supabase.from("posts").select(POST_FIELDS).ilike("url", pattern).limit(80),
      supabase
        .from("comments")
        .select("id, post_id, content, created_at, user_id")
        .ilike("content", pattern)
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

  const postMap = new Map<string, AdminModerationPost>();
  for (const row of [...(byTitle ?? []), ...(byDesc ?? []), ...(byUrl ?? [])]) {
    postMap.set((row as AdminModerationPost).id, row as AdminModerationPost);
  }
  const posts = [...postMap.values()].sort((a, b) => {
    const st = (s: string) => (s === "pending" ? 0 : s === "published" ? 1 : 2);
    const c = st(a.moderation_status) - st(b.moderation_status);
    if (c !== 0) return c;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return {
    posts,
    comments: (byComments ?? []) as AdminModerationComment[],
  };
}
