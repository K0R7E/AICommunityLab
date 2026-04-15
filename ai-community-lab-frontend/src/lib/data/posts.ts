import { createClient } from "@/lib/supabase/server";
import type { PostRow } from "@/lib/types/post";

export async function getFeedPosts(options: {
  sort: "new" | "top";
  category: string | null;
}): Promise<{
  posts: PostRow[];
  votedIds: Set<string>;
  userId: string | null;
  userEmail: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let q = supabase.from("posts").select("*");
  if (options.category) {
    q = q.eq("category", options.category);
  }
  if (options.sort === "top") {
    q = q
      .order("votes_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  const { data: posts, error } = await q;

  if (error) {
    console.error(error.message);
    return {
      posts: [],
      votedIds: new Set(),
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
    };
  }

  const list = (posts ?? []) as PostRow[];
  let votedIds = new Set<string>();
  if (user && list.length > 0) {
    const ids = list.map((p) => p.id);
    const { data: votes } = await supabase
      .from("votes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", ids);
    votedIds = new Set(votes?.map((v) => v.post_id as string) ?? []);
  }

  return {
    posts: list,
    votedIds,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
  };
}
