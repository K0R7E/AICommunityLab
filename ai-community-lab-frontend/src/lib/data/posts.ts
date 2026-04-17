import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";
import { POST_MODERATION_PUBLISHED } from "@/lib/moderation";
import { escapeLikePattern } from "@/lib/search-utils";
import type { PostRow } from "@/lib/types/post";

async function filterToPublishedPostIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
): Promise<string[]> {
  const uniq = [...new Set(ids)];
  if (uniq.length === 0) return [];
  const { data } = await supabase
    .from("posts")
    .select("id")
    .in("id", uniq)
    .eq("moderation_status", POST_MODERATION_PUBLISHED);
  return (data ?? []).map((row) => (row as { id: string }).id);
}

async function postIdsMatchingCategoryLabels(
  supabase: Awaited<ReturnType<typeof createClient>>,
  term: string,
): Promise<string[]> {
  const termLower = term.toLowerCase();
  const labels = CATEGORIES.filter((c) => c.toLowerCase().includes(termLower));
  if (labels.length === 0) return [];
  const ids = new Set<string>();
  for (const label of labels) {
    const { data } = await supabase
      .from("posts")
      .select("id")
      .eq("moderation_status", POST_MODERATION_PUBLISHED)
      .contains("categories", [label]);
    for (const row of data ?? []) ids.add((row as { id: string }).id);
  }
  return [...ids];
}

async function collectPostIdsForSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rawQuery: string,
): Promise<string[]> {
  const term = rawQuery.trim();
  if (!term) return [];

  const pattern = `%${escapeLikePattern(term)}%`;

  const [byTitle, byDesc, byUrl, byCategoryIds, byComments] = await Promise.all([
    supabase
      .from("posts")
      .select("id")
      .eq("moderation_status", POST_MODERATION_PUBLISHED)
      .ilike("title", pattern),
    supabase
      .from("posts")
      .select("id")
      .eq("moderation_status", POST_MODERATION_PUBLISHED)
      .ilike("description", pattern),
    supabase
      .from("posts")
      .select("id")
      .eq("moderation_status", POST_MODERATION_PUBLISHED)
      .ilike("url", pattern),
    postIdsMatchingCategoryLabels(supabase, term),
    supabase
      .from("comments")
      .select("post_id, posts!inner(moderation_status)")
      .eq("posts.moderation_status", POST_MODERATION_PUBLISHED)
      .ilike("content", pattern),
  ]);

  const ids = new Set<string>();
  for (const row of byTitle.data ?? []) ids.add((row as { id: string }).id);
  for (const row of byDesc.data ?? []) ids.add((row as { id: string }).id);
  for (const row of byUrl.data ?? []) ids.add((row as { id: string }).id);
  for (const id of byCategoryIds) ids.add(id);
  for (const row of byComments.data ?? []) {
    const id = (row as { post_id: string }).post_id;
    if (id) ids.add(id);
  }

  return filterToPublishedPostIds(supabase, [...ids]);
}

async function fetchMyRatings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  postIds: string[],
): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const { data } = await supabase
    .from("ratings")
    .select("post_id, value")
    .eq("user_id", userId)
    .in("post_id", postIds);
  const m = new Map<string, number>();
  for (const row of data ?? []) {
    m.set((row as { post_id: string; value: number }).post_id, (row as { value: number }).value);
  }
  return m;
}

export async function getFeedPosts(options: {
  sort: "new" | "top";
  /** Show posts that have at least one of these categories (OR). */
  categoryLabels: string[];
  searchQuery: string | null;
}): Promise<{
  posts: PostRow[];
  myRatings: Map<string, number>;
  userId: string | null;
  userEmail: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const search = options.searchQuery?.trim() || null;

  if (search) {
    const postIds = await collectPostIdsForSearch(supabase, search);
    if (postIds.length === 0) {
      return {
        posts: [],
        myRatings: new Map(),
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
      };
    }

    let q = supabase
      .from("posts")
      .select("*")
      .in("id", postIds)
      .eq("moderation_status", POST_MODERATION_PUBLISHED);
    if (options.categoryLabels.length > 0) {
      q = q.overlaps("categories", options.categoryLabels);
    }
    if (options.sort === "top") {
      q = q
        .order("rating_avg", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
    } else {
      q = q.order("created_at", { ascending: false });
    }

    const { data: posts, error } = await q;

    if (error) {
      console.error(error.message);
      return {
        posts: [],
        myRatings: new Map(),
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
      };
    }

    const list = (posts ?? []) as PostRow[];
    const myRatings =
      user && list.length > 0
        ? await fetchMyRatings(
            supabase,
            user.id,
            list.map((p) => p.id),
          )
        : new Map<string, number>();

    return {
      posts: list,
      myRatings,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
    };
  }

  let q = supabase
    .from("posts")
    .select("*")
    .eq("moderation_status", POST_MODERATION_PUBLISHED);
  if (options.categoryLabels.length > 0) {
    q = q.overlaps("categories", options.categoryLabels);
  }
  if (options.sort === "top") {
    q = q
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  const { data: posts, error } = await q;

  if (error) {
    console.error(error.message);
    return {
      posts: [],
      myRatings: new Map(),
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
    };
  }

  const list = (posts ?? []) as PostRow[];
  const myRatings =
    user && list.length > 0
      ? await fetchMyRatings(
          supabase,
          user.id,
          list.map((p) => p.id),
        )
      : new Map<string, number>();

  return {
    posts: list,
    myRatings,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
  };
}
