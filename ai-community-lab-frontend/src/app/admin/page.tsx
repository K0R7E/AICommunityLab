import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";
import { getCurrentUserIsAdmin } from "@/lib/admin";
import { getAdminModerationData } from "@/lib/data/admin-moderation";
import { FeedSearch } from "@/components/shell/feed-search";
import { AdminCommentEditor } from "./admin-comment-editor";
import { AdminPostEditor } from "./admin-post-editor";

export const metadata = {
  title: "Moderation · AICommunityLab",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await getCurrentUserIsAdmin())) {
    redirect("/");
  }

  const sp = await searchParams;
  const q = sp.q?.trim() || null;

  const { posts, comments } = await getAdminModerationData({ q });

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Moderation</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Approve new submissions for the public feed, edit or delete posts and
          comments, and review reports. Changes apply immediately.
        </p>
      </div>

      <Suspense fallback={null}>
        <FeedSearch
          basePath="/admin"
          placeholder="Search posts and comments…"
          aria-label="Search moderation queue"
        />
      </Suspense>

      <section>
        <h2 className="text-lg font-semibold text-zinc-100">Recent posts</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {posts.length === 0 ? (
            <li className="text-sm text-zinc-500">
              {q ? "No posts match your search." : "No posts."}
            </li>
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
                      {(p.categories ?? []).join(" · ")} ·{" "}
                      {formatRelativeTime(p.created_at)}
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
            <li className="text-sm text-zinc-500">
              {q ? "No comments match your search." : "No comments."}
            </li>
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
