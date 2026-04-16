import Link from "next/link";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";
import { getCurrentUserIsAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminCommentEditor } from "./admin-comment-editor";
import { AdminPostEditor } from "./admin-post-editor";

export const metadata = {
  title: "Moderation · AICommunityLab",
};

export default async function AdminPage() {
  if (!(await getCurrentUserIsAdmin())) {
    redirect("/");
  }

  const supabase = await createClient();

  const [{ data: recentPosts }, { data: recentComments }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, title, url, description, categories, image_url, moderation_status, created_at, user_id",
      )
      .order("moderation_status", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("comments")
      .select("id, post_id, content, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const posts = (recentPosts ?? []) as {
    id: string;
    title: string;
    url: string | null;
    description: string | null;
    categories: string[];
    image_url: string | null;
    moderation_status: string;
    created_at: string;
    user_id: string;
  }[];

  const comments = (recentComments ?? []) as {
    id: string;
    post_id: string;
    content: string;
    created_at: string;
    user_id: string;
  }[];

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Moderation</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Approve new submissions for the public feed, edit or delete posts and
          comments, and review reports. Changes apply immediately.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-zinc-100">Recent posts</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {posts.length === 0 ? (
            <li className="text-sm text-zinc-500">No posts.</li>
          ) : (
            posts.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-zinc-800 bg-[#141414] px-4 py-3"
              >
                <AdminPostEditor post={p}>
                  <div>
                    <Link
                      href={`/post/${p.id}`}
                      className="font-medium text-[#00ff9f] hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-xs text-zinc-500">
                      {(p.categories ?? []).join(" · ")} · {formatRelativeTime(p.created_at)}
                    </p>
                  </div>
                </AdminPostEditor>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-100">Recent comments</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {comments.length === 0 ? (
            <li className="text-sm text-zinc-500">No comments.</li>
          ) : (
            comments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-800 bg-[#141414] px-4 py-3"
              >
                <AdminCommentEditor id={c.id} postId={c.post_id} content={c.content}>
                  <div>
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm text-zinc-200">
                      {c.content}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      <Link
                        href={`/post/${c.post_id}`}
                        className="text-[#00ff9f] hover:underline"
                      >
                        Open post
                      </Link>
                      {" · "}
                      {formatRelativeTime(c.created_at)}
                    </p>
                  </div>
                </AdminCommentEditor>
              </li>
            ))
          )}
        </ul>
      </section>

      <p className="text-center text-sm text-zinc-500">
        <Link href="/" className="text-[#00ff9f] hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
