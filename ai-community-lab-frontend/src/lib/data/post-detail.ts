import { createClient } from "@/lib/supabase/server";
import type { PostRow } from "@/lib/types/post";

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  author_username: string | null;
  author_avatar_url: string | null;
};

export async function getPostById(id: string): Promise<PostRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as PostRow;
}

export async function getCommentsForPost(
  postId: string,
): Promise<CommentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, content, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error || !data?.length) return [];

  const userIds = [
    ...new Set(
      data
        .map((c) => (c as { user_id: string | null }).user_id)
        .filter((id): id is string => id !== null),
    ),
  ];
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

  return data.map((c) => {
    const row = c as { id: string; post_id: string; user_id: string | null; content: string; created_at: string };
    const profile = row.user_id ? profileMap.get(row.user_id) : undefined;
    return {
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      author_username: profile?.username ?? null,
      author_avatar_url: profile?.avatar_url ?? null,
    };
  });
}

export async function getMyRatingForPost(
  postId: string,
): Promise<{ myRating: number | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { myRating: null };
  }

  const { data } = await supabase
    .from("ratings")
    .select("value")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    myRating: data ? (data as { value: number }).value : null,
  };
}
