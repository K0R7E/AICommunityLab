import { createClient } from "@/lib/supabase/server";
import { POST_MODERATION_PUBLISHED } from "@/lib/moderation";
import type { PostRow } from "@/lib/types/post";

const DEFAULT_FEED_PAGE_SIZE = 20;
const MAX_FEED_PAGE_SIZE = 50;

type FeedCursor = {
  createdAt: string;
  id: string;
};

function decodeFeedCursor(rawCursor: string | null | undefined): FeedCursor | null {
  if (!rawCursor) return null;
  const params = new URLSearchParams(rawCursor);
  const createdAt = params.get("createdAt")?.trim();
  const id = params.get("id")?.trim();
  if (!createdAt || !id) return null;
  return { createdAt, id };
}

function encodeFeedCursor(post: PostRow): string {
  const params = new URLSearchParams();
  params.set("createdAt", post.created_at);
  params.set("id", post.id);
  return params.toString();
}

function normalizePageSize(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_FEED_PAGE_SIZE;
  const n = Math.floor(value ?? DEFAULT_FEED_PAGE_SIZE);
  if (n < 1) return DEFAULT_FEED_PAGE_SIZE;
  return Math.min(n, MAX_FEED_PAGE_SIZE);
}

type SearchPublishedPostRpcRow = {
  id: string;
};

async function collectPostIdsForSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rawQuery: string,
  options: {
    categoryLabels: string[];
    cursorCreatedAt?: string | null;
    maxResults: number;
  },
): Promise<string[]> {
  const term = rawQuery.trim();
  if (!term) return [];

  const { data, error } = await supabase.rpc("search_published_posts", {
    p_query: term,
    p_category_labels: options.categoryLabels.length > 0 ? options.categoryLabels : null,
    p_cursor: options.cursorCreatedAt ?? null,
    p_limit: options.maxResults,
  });
  if (error) {
    console.error(error.message);
    return [];
  }
  const ids = Array.isArray(data)
    ? (data as SearchPublishedPostRpcRow[])
        .map((row) => row.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  return [...new Set(ids)];
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
  cursor?: string | null;
  pageSize?: number;
}): Promise<{
  posts: PostRow[];
  myRatings: Map<string, number>;
  userId: string | null;
  userEmail: string | null;
  nextCursor: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const search = options.searchQuery?.trim() || null;
  const cursor = options.sort === "new" ? decodeFeedCursor(options.cursor) : null;
  const pageSize = normalizePageSize(options.pageSize);

  if (search) {
    const postIds = await collectPostIdsForSearch(supabase, search, {
      categoryLabels: options.categoryLabels,
      cursorCreatedAt: options.sort === "new" ? cursor?.createdAt ?? null : null,
      maxResults: options.sort === "new" ? pageSize + 1 : MAX_FEED_PAGE_SIZE,
    });
    if (postIds.length === 0) {
      return {
        posts: [],
        myRatings: new Map(),
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        nextCursor: null,
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
        .order("leaderboard_score", { ascending: false, nullsFirst: false })
        .order("bayes_score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
    } else {
      q = q.order("created_at", { ascending: false }).order("id", { ascending: false });
      q = q.limit(pageSize + 1);
    }

    const { data: posts, error } = await q;

    if (error) {
      console.error(error.message);
      return {
        posts: [],
        myRatings: new Map(),
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        nextCursor: null,
      };
    }

    const queriedList = (posts ?? []) as PostRow[];
    const hasMore = options.sort === "new" && queriedList.length > pageSize;
    const list = hasMore ? queriedList.slice(0, pageSize) : queriedList;
    const nextCursor = hasMore ? encodeFeedCursor(list[list.length - 1]) : null;
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
      nextCursor,
    };
  }

  let q = supabase
    .from("posts")
    .select("*")
    .eq("moderation_status", POST_MODERATION_PUBLISHED);
  if (options.categoryLabels.length > 0) {
    q = q.overlaps("categories", options.categoryLabels);
  }
  if (options.sort === "new" && cursor) {
    q = q.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  }
  if (options.sort === "top") {
    q = q
      .order("leaderboard_score", { ascending: false, nullsFirst: false })
      .order("bayes_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false }).order("id", { ascending: false });
    q = q.limit(pageSize + 1);
  }

  const { data: posts, error } = await q;

  if (error) {
    console.error(error.message);
    return {
      posts: [],
      myRatings: new Map(),
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      nextCursor: null,
    };
  }

  const queriedList = (posts ?? []) as PostRow[];
  const hasMore = options.sort === "new" && queriedList.length > pageSize;
  const list = hasMore ? queriedList.slice(0, pageSize) : queriedList;
  const nextCursor = hasMore ? encodeFeedCursor(list[list.length - 1]) : null;
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
    nextCursor,
  };
}
