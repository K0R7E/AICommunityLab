import type { SupabaseClient } from "@supabase/supabase-js";
import { canonicalToolUrl } from "@/lib/canonical-tool-url";
import {
  loadSimilarPostsForSubmit,
  SIMILARITY_BLOCK_THRESHOLD,
} from "@/lib/duplicate-post-check";
import { createClient } from "@/lib/supabase/server";
import { escapeLikePattern } from "@/lib/search-utils";

export const POSTS_PAGE_SIZE = 20;
export const COMMENTS_PAGE_SIZE = 30;

const POST_FIELDS =
  "id, title, url, url_canonical, description, categories, post_kind, moderation_status, created_at, user_id" as const;

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
  post_kind?: "AI Engine" | "AI Agent" | string;
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
  author_username: string | null;
  author_avatar_url: string | null;
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

/** Attach author username/avatar to raw comment rows. */
async function enrichCommentAuthors(
  comments: { id: string; post_id: string; content: string; created_at: string; user_id: string }[],
  supabase: SupabaseClient,
): Promise<AdminModerationComment[]> {
  if (comments.length === 0) return [];

  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      (p as { id: string }).id,
      p as { id: string; username: string; avatar_url: string | null },
    ]),
  );

  return comments.map((c) => {
    const profile = profileMap.get(c.user_id);
    return {
      ...c,
      author_username: profile?.username ?? null,
      author_avatar_url: profile?.avatar_url ?? null,
    };
  });
}

export async function getAdminModerationData(options: {
  q: string | null;
  /** 1-based page number — each page loads PAGE_SIZE more items cumulatively. */
  postsPage?: number;
  commentsPage?: number;
}): Promise<{
  posts: AdminModerationPost[];
  comments: AdminModerationComment[];
  hasMorePosts: boolean;
  hasMoreComments: boolean;
}> {
  const supabase = await createClient();
  const term = options.q?.trim() || null;
  const postsPage = Math.max(1, options.postsPage ?? 1);
  const commentsPage = Math.max(1, options.commentsPage ?? 1);
  // Fetch one extra to detect whether more pages exist.
  const postsLimit = postsPage * POSTS_PAGE_SIZE + 1;
  const commentsLimit = commentsPage * COMMENTS_PAGE_SIZE + 1;

  let rawPosts: AdminModerationPost[];
  let rawComments: { id: string; post_id: string; content: string; created_at: string; user_id: string }[];

  if (!term) {
    const [{ data: recentPosts }, { data: recentComments }] = await Promise.all([
      supabase
        .from("posts")
        .select(POST_FIELDS)
        // pending first, then published, then rejected (alphabetical sort achieves this)
        .order("moderation_status", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(postsLimit),
      supabase
        .from("comments")
        .select("id, post_id, content, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(commentsLimit),
    ]);

    rawPosts = (recentPosts ?? []) as AdminModerationPost[];
    rawComments = (recentComments ?? []) as typeof rawComments;
  } else {
    const pattern = `%${escapeLikePattern(term)}%`;
    const [{ data: byTitle }, { data: byDesc }, { data: byUrl }, { data: byComments }] =
      await Promise.all([
        supabase.from("posts").select(POST_FIELDS).ilike("title", pattern).limit(postsLimit),
        supabase.from("posts").select(POST_FIELDS).ilike("description", pattern).limit(postsLimit),
        supabase.from("posts").select(POST_FIELDS).ilike("url", pattern).limit(postsLimit),
        supabase
          .from("comments")
          .select("id, post_id, content, created_at, user_id")
          .ilike("content", pattern)
          .order("created_at", { ascending: false })
          .limit(commentsLimit),
      ]);

    const postMap = new Map<string, AdminModerationPost>();
    for (const row of [...(byTitle ?? []), ...(byDesc ?? []), ...(byUrl ?? [])]) {
      postMap.set((row as AdminModerationPost).id, row as AdminModerationPost);
    }
    rawPosts = [...postMap.values()].sort((a, b) => {
      const st = (s: string) => (s === "pending" ? 0 : s === "published" ? 1 : 2);
      const c = st(a.moderation_status) - st(b.moderation_status);
      if (c !== 0) return c;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    rawComments = (byComments ?? []) as typeof rawComments;
  }

  // Detect whether more items exist beyond the current page.
  const hasMorePosts = rawPosts.length > postsPage * POSTS_PAGE_SIZE;
  const hasMoreComments = rawComments.length > commentsPage * COMMENTS_PAGE_SIZE;

  // Slice to exactly the requested page size (drop the sentinel extra item).
  rawPosts = rawPosts.slice(0, postsPage * POSTS_PAGE_SIZE);
  rawComments = rawComments.slice(0, commentsPage * COMMENTS_PAGE_SIZE);

  const [posts, comments] = await Promise.all([
    enrichModerationDuplicateHints(rawPosts, supabase),
    enrichCommentAuthors(rawComments, supabase),
  ]);

  return { posts, comments, hasMorePosts, hasMoreComments };
}
