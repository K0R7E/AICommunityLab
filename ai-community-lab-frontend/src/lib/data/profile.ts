import { createClient } from "@/lib/supabase/server";
import { POST_MODERATION_PUBLISHED } from "@/lib/moderation";
import type { PostRow } from "@/lib/types/post";
import type { ProfileRow } from "@/lib/types/profile";

export async function getProfileByUsername(
  username: string,
): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileRow;
}

export async function getProfileByUserId(
  userId: string,
): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileRow;
}

export async function getUserProfileStats(userId: string): Promise<{
  totalPosts: number;
  /** Sum of `rating_sum` across the user’s posts (all 1–5 scores from voters). */
  totalRatingPoints: number;
}> {
  return getUserProfileStatsScoped(userId, { includeUnpublished: false });
}

export async function getUserProfileStatsScoped(
  userId: string,
  options: { includeUnpublished: boolean },
): Promise<{
  totalPosts: number;
  totalRatingPoints: number;
}> {
  const supabase = await createClient();
  let countQuery = supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (!options.includeUnpublished) {
    countQuery = countQuery.eq("moderation_status", POST_MODERATION_PUBLISHED);
  }
  const { count, error: countError } = await countQuery;

  if (countError) {
    return { totalPosts: 0, totalRatingPoints: 0 };
  }

  let rowsQuery = supabase
    .from("posts")
    .select("rating_sum")
    .eq("user_id", userId);
  if (!options.includeUnpublished) {
    rowsQuery = rowsQuery.eq("moderation_status", POST_MODERATION_PUBLISHED);
  }
  const { data: rows } = await rowsQuery;

  const totalRatingPoints =
    rows?.reduce((sum, r) => sum + (r.rating_sum as number), 0) ?? 0;

  return {
    totalPosts: count ?? 0,
    totalRatingPoints,
  };
}

export async function getPostsByUserId(userId: string): Promise<PostRow[]> {
  return getPostsByUserIdScoped(userId, { includeUnpublished: false });
}

export async function getPostsByUserIdScoped(
  userId: string,
  options: { includeUnpublished: boolean },
): Promise<PostRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!options.includeUnpublished) {
    query = query.eq("moderation_status", POST_MODERATION_PUBLISHED);
  }
  const { data, error } = await query;

  if (error) return [];
  return (data ?? []) as PostRow[];
}

export type ProfileCommentRow = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  post_title: string;
};

export async function getCommentsByUserId(
  userId: string,
  limit = 40,
): Promise<ProfileCommentRow[]> {
  return getCommentsByUserIdScoped(userId, { includeUnpublished: false, limit });
}

export async function getCommentsByUserIdScoped(
  userId: string,
  options: { includeUnpublished: boolean; limit?: number },
): Promise<ProfileCommentRow[]> {
  const supabase = await createClient();
  const limit = options.limit ?? 40;
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, content, created_at, posts(title, moderation_status)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as {
    id: string;
    post_id: string;
    content: string;
    created_at: string;
    posts:
      | { title: string; moderation_status?: string | null }
      | { title: string; moderation_status?: string | null }[]
      | null;
  }[]).map((r) => {
    const post = r.posts;
    const firstPost = !Array.isArray(post) ? post : (post[0] ?? null);
    if (
      !options.includeUnpublished &&
      firstPost &&
      firstPost.moderation_status !== POST_MODERATION_PUBLISHED
    ) {
      return null;
    }
    const title =
      firstPost
        ? firstPost.title
          : "Post";
    return {
      id: r.id,
      post_id: r.post_id,
      content: r.content,
      created_at: r.created_at,
      post_title: title,
    };
  }).filter((row): row is ProfileCommentRow => row !== null);
}
