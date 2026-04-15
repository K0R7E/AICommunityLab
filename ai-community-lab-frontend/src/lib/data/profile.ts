import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    return { totalPosts: 0, totalRatingPoints: 0 };
  }

  const { data: rows } = await supabase
    .from("posts")
    .select("rating_sum")
    .eq("user_id", userId);

  const totalRatingPoints =
    rows?.reduce((sum, r) => sum + (r.rating_sum as number), 0) ?? 0;

  return {
    totalPosts: count ?? 0,
    totalRatingPoints,
  };
}

export async function getPostsByUserId(userId: string): Promise<PostRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as PostRow[];
}
