import { createClient } from "@/lib/supabase/server";
import { escapeLikePattern } from "@/lib/search-utils";

export type UserSearchResult = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  total_posts: number;
  total_rating_points: number;
};

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const supabase = await createClient();

  if (!query.trim()) {
    // Return most active users by default (highest rating points)
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio")
      .order("username", { ascending: true })
      .limit(40);

    if (!data?.length) return [];
    return enrichWithStats(data as { id: string; username: string; avatar_url: string | null; bio: string | null }[], supabase);
  }

  const pattern = `%${escapeLikePattern(query.trim())}%`;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio")
    .ilike("username", pattern)
    .order("username", { ascending: true })
    .limit(40);

  if (!data?.length) return [];
  return enrichWithStats(data as { id: string; username: string; avatar_url: string | null; bio: string | null }[], supabase);
}

async function enrichWithStats(
  profiles: { id: string; username: string; avatar_url: string | null; bio: string | null }[],
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<UserSearchResult[]> {
  const ids = profiles.map((p) => p.id);

  const { data: posts } = await supabase
    .from("posts")
    .select("user_id, rating_sum")
    .in("user_id", ids)
    .eq("moderation_status", "published");

  const statsMap = new Map<string, { total_posts: number; total_rating_points: number }>();
  for (const id of ids) statsMap.set(id, { total_posts: 0, total_rating_points: 0 });
  for (const post of posts ?? []) {
    const row = post as { user_id: string; rating_sum: number };
    const s = statsMap.get(row.user_id);
    if (s) {
      s.total_posts += 1;
      s.total_rating_points += row.rating_sum ?? 0;
    }
  }

  return profiles.map((p) => ({
    ...p,
    ...(statsMap.get(p.id) ?? { total_posts: 0, total_rating_points: 0 }),
  }));
}
