import type { SupabaseClient } from "@supabase/supabase-js";
import { canonicalToolUrl } from "@/lib/canonical-tool-url";
import {
  loadSimilarPostsForSubmit,
  SIMILARITY_BLOCK_THRESHOLD,
} from "@/lib/duplicate-post-check";
import { createClient } from "@/lib/supabase/server";
import { escapeLikePattern } from "@/lib/search-utils";

const POST_FIELDS =
  "id, title, url, url_canonical, description, categories, moderation_status, created_at, user_id" as const;

export type AdminDuplicateHint =
  | { type: "url"; otherId: string; otherTitle: string }
  | { type: "similar"; otherId: string; otherTitle: string; score: number };

export type AdminModerationPost = {
  id: string;
  title: string;
  url: string | null;
  url_canonical?: string | null;
  description: string | null;
  categories: string[];
  moderation_status: string;
  created_at: string;
  user_id: string;
  duplicateHints?: AdminDuplicateHint[];
};

export type AdminModerationComment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_id: string;
};

function effectiveUrlCanonical(p: AdminModerationPost): string | null {
  const stored = p.url_canonical?.trim();
  if (stored) return stored;
  return canonicalToolUrl(p.url);
}

function addHint(
  hintsMap: Map<string, AdminDuplicateHint[]>,
  postId: string,
  hint: AdminDuplicateHint,
) {
  const list = hintsMap.get(postId);
  if (!list) return;
  if (list.some((h) => h.otherId === hint.otherId)) return;
  list.push(hint);
}

async function enrichModerationDuplicateHints(
  posts: AdminModerationPost[],
  supabase: SupabaseClient,
): Promise<AdminModerationPost[]> {
  if (posts.length === 0) return posts;

  const hintsMap = new Map<string, AdminDuplicateHint[]>();
  for (const p of posts) {
    hintsMap.set(p.id, []);
  }

  // Same canonical URL among posts on this page (covers legacy rows without url_canonical)
  const byEffective = new Map<string, AdminModerationPost[]>();
  for (const p of posts) {
    const key = effectiveUrlCanonical(p);
    if (!key) continue;
    const arr = byEffective.get(key) ?? [];
    arr.push(p);
    byEffective.set(key, arr);
  }
  for (const [, group] of byEffective) {
    if (group.length < 2) continue;
    for (const a of group) {
      for (const b of group) {
        if (a.id === b.id) continue;
        addHint(hintsMap, a.id, { type: "url", otherId: b.id, otherTitle: b.title });
      }
    }
  }

  // Same canonical URL as any other pending/published post (may be outside this page)
  const storedCanonicals = new Set(
    posts.map((p) => p.url_canonical?.trim()).filter((c): c is string => Boolean(c)),
  );
  for (const canon of storedCanonicals) {
    const { data: rows } = await supabase
      .from("posts")
      .select("id, title")
      .eq("url_canonical", canon)
      .in("moderation_status", ["pending", "published"]);

    const list = (rows ?? []) as { id: string; title: string }[];
    if (list.length < 2) continue;

    for (const p of posts) {
      if (p.url_canonical?.trim() !== canon) continue;
      for (const o of list) {
        if (o.id === p.id) continue;
        addHint(hintsMap, p.id, { type: "url", otherId: o.id, otherTitle: o.title });
      }
    }
  }

  // Title/description similarity (same RPC as submit flow); cap concurrency
  const eligible = posts.filter((p) => p.title.trim().length >= 3);
  const batch = 6;
  for (let i = 0; i < eligible.length; i += batch) {
    const slice = eligible.slice(i, i + batch);
    await Promise.all(
      slice.map(async (p) => {
        const candidates = await loadSimilarPostsForSubmit(
          supabase,
          p.title,
          p.description ?? null,
        );
        for (const c of candidates) {
          if (c.id === p.id) continue;
          const sc = Number(c.score) || 0;
          if (sc < SIMILARITY_BLOCK_THRESHOLD) continue;
          addHint(hintsMap, p.id, {
            type: "similar",
            otherId: c.id,
            otherTitle: c.title,
            score: sc,
          });
        }
      }),
    );
  }

  return posts.map((p) => {
    const hints = hintsMap.get(p.id) ?? [];
    if (hints.length === 0) return { ...p };
    hints.sort((a, b) => {
      if (a.type === "url" && b.type !== "url") return -1;
      if (a.type !== "url" && b.type === "url") return 1;
      if (a.type === "similar" && b.type === "similar") {
        return (b.score ?? 0) - (a.score ?? 0);
      }
      return 0;
    });
    return { ...p, duplicateHints: hints };
  });
}

export async function getAdminModerationData(options: {
  q: string | null;
}): Promise<{ posts: AdminModerationPost[]; comments: AdminModerationComment[] }> {
  const supabase = await createClient();
  const term = options.q?.trim() || null;

  let posts: AdminModerationPost[];

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
    posts = (recentPosts ?? []) as AdminModerationPost[];
    const comments = (recentComments ?? []) as AdminModerationComment[];
    posts = await enrichModerationDuplicateHints(posts, supabase);
    return { posts, comments };
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
  posts = [...postMap.values()].sort((a, b) => {
    const st = (s: string) => (s === "pending" ? 0 : s === "published" ? 1 : 2);
    const c = st(a.moderation_status) - st(b.moderation_status);
    if (c !== 0) return c;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  posts = await enrichModerationDuplicateHints(posts, supabase);

  return {
    posts,
    comments: (byComments ?? []) as AdminModerationComment[],
  };
}
