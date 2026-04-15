import { createClient } from "@/lib/supabase/server";
import type { PostRow } from "@/lib/types/post";

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
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
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as CommentRow[];
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
