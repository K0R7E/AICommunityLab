import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";
import { getCurrentUserIsAdmin } from "@/lib/admin";
import { getAdminModerationData, POSTS_PAGE_SIZE, COMMENTS_PAGE_SIZE } from "@/lib/data/admin-moderation";
import { FeedSearch } from "@/components/shell/feed-search";
import { AdminCommentEditor } from "./admin-comment-editor";
import { AdminPostEditor } from "./admin-post-editor";
import { AdminAuditLogView } from "./admin-audit-log-view";
import { AdminUserActivityView } from "./admin-user-activity-view";
import type { EventCategory } from "@/lib/data/admin-user-activity";
import { safeHttpsImageUrl } from "@/lib/safe-remote-media-url";

export const metadata = {
  title: "Moderation · AICommunityLab",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; category?: string; u?: string; postsPage?: string; commentsPage?: string }>;
}) {
  if (!(await getCurrentUserIsAdmin())) {
    redirect("/");
  }

  const sp = await searchParams;
  const view = sp.view === "audit" ? "audit" : sp.view === "activity" ? "activity" : "moderation";
  const q = sp.q?.trim() || null;
  const category = (["all", "auth", "content", "account"].includes(sp.category ?? "")
    ? sp.category
    : "all") as EventCategory;
  const userSearch = sp.u?.trim() || null;
  const postsPage = Math.max(1, parseInt(sp.postsPage ?? "1", 10) || 1);
  const commentsPage = Math.max(1, parseInt(sp.commentsPage ?? "1", 10) || 1);

  const { posts, comments, hasMorePosts, hasMoreComments } =
    view === "moderation"
      ? await getAdminModerationData({ q, postsPage, commentsPage })
      : { posts: [], comments: [], hasMorePosts: false, hasMoreComments: false };

  // Build "load more" hrefs that preserve existing params
  function buildHref(extra: Record<string, string | number>) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (postsPage > 1) p.set("postsPage", String(postsPage));
    if (commentsPage > 1) p.set("commentsPage", String(commentsPage));
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    const qs = p.toString();
    return `/admin${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Admin</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {view === "moderation"
            ? "Approve new submissions for the public feed, edit or delete posts and comments, and review reports. Changes apply immediately."
            : "Full history of all admin moderation actions."}
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-zinc-800 bg-surface-sunken p-0.5">
        <Link
          href="/admin"
          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
            view === "moderation"
              ? "bg-zinc-800 text-accent"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Moderation
        </Link>
        <Link
          href="/admin?view=activity"
          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
            view === "activity"
              ? "bg-zinc-800 text-accent"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          User activity
        </Link>
        <Link
          href="/admin?view=audit"
          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
            view === "audit"
              ? "bg-zinc-800 text-accent"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Audit log
        </Link>
      </div>

      {view === "audit" ? (
        <AdminAuditLogView />
      ) : view === "activity" ? (
        <AdminUserActivityView category={category} userSearch={userSearch} />
      ) : (
        <>
          <Suspense fallback={null}>
            <FeedSearch
              basePath="/admin"
              placeholder="Search posts and comments…"
              aria-label="Search moderation queue"
            />
          </Suspense>

          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold text-zinc-100">Posts</h2>
              <span className="text-xs text-zinc-500">
                Showing {posts.length} · pending first
              </span>
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {posts.length === 0 ? (
                <li className="text-sm text-zinc-500">
                  {q ? "No posts match your search." : "No posts."}
                </li>
              ) : (
                posts.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-zinc-800 bg-surface-sunken px-4 py-3"
                  >
                    <AdminPostEditor post={p}>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              p.moderation_status === "pending"
                                ? "bg-amber-900/50 text-amber-300"
                                : p.moderation_status === "published"
                                  ? "bg-emerald-900/50 text-emerald-300"
                                  : "bg-red-900/50 text-red-300"
                            }`}
                          >
                            {p.moderation_status}
                          </span>
                          <Link
                            href={`/post/${p.id}`}
                            className="font-medium text-accent hover:underline"
                          >
                            {p.title}
                          </Link>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {p.post_kind ?? "AI Engine"} ·{" "}
                          {(p.categories ?? []).join(" · ")} ·{" "}
                          {formatRelativeTime(p.created_at)}
                        </p>
                        {p.duplicateHints?.length ? (
                          <div className="mt-2 rounded-md border border-amber-800/45 bg-amber-950/25 px-2.5 py-2 text-xs text-amber-100/95">
                            <p className="font-semibold text-amber-50">Duplicate / similar listings</p>
                            <ul className="mt-1.5 list-inside list-disc space-y-1 text-amber-100/90">
                              {p.duplicateHints.map((h) => (
                                <li key={`${h.type}-${h.otherId}`}>
                                  {h.type === "url" ? (
                                    <>
                                      Same canonical URL as{" "}
                                      <Link
                                        href={`/post/${h.otherId}`}
                                        className="font-medium text-accent hover:underline"
                                      >
                                        {h.otherTitle}
                                      </Link>
                                    </>
                                  ) : (
                                    <>
                                      Similar title/description (score {(h.score ?? 0).toFixed(2)}):{" "}
                                      <Link
                                        href={`/post/${h.otherId}`}
                                        className="font-medium text-accent hover:underline"
                                      >
                                        {h.otherTitle}
                                      </Link>
                                    </>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </AdminPostEditor>
                  </li>
                ))
              )}
            </ul>
            {hasMorePosts ? (
              <div className="mt-4 text-center">
                <Link
                  href={buildHref({ postsPage: postsPage + 1 })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-surface-sunken px-4 py-2 text-sm text-zinc-300 transition hover:border-accent/50 hover:text-accent"
                >
                  Load {POSTS_PAGE_SIZE} more posts
                </Link>
              </div>
            ) : posts.length > 0 ? (
              <p className="mt-4 text-center text-xs text-zinc-600">All posts shown</p>
            ) : null}
          </section>

          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold text-zinc-100">Comments</h2>
              <span className="text-xs text-zinc-500">
                Showing {comments.length} · newest first
              </span>
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {comments.length === 0 ? (
                <li className="text-sm text-zinc-500">
                  {q ? "No comments match your search." : "No comments."}
                </li>
              ) : (
                comments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-zinc-800 bg-surface-sunken px-4 py-3"
                  >
                    <AdminCommentEditor id={c.id} postId={c.post_id} content={c.content}>
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          {c.author_avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={safeHttpsImageUrl(c.author_avatar_url) ?? ""}
                              alt=""
                              width={18}
                              height={18}
                              className="size-[18px] rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="flex size-[18px] items-center justify-center rounded-full bg-zinc-700 text-[9px] font-semibold text-accent">
                              {(c.author_username ?? "?").slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          {c.author_username ? (
                            <Link
                              href={`/profile/${encodeURIComponent(c.author_username)}`}
                              className="text-xs font-medium text-zinc-300 hover:text-accent hover:underline"
                            >
                              {c.author_username}
                            </Link>
                          ) : (
                            <span className="text-xs text-zinc-500">deleted user</span>
                          )}
                        </div>
                        <p className="line-clamp-3 whitespace-pre-wrap text-sm text-zinc-200">
                          {c.content}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          <Link
                            href={`/post/${c.post_id}`}
                            className="text-accent hover:underline"
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
            {hasMoreComments ? (
              <div className="mt-4 text-center">
                <Link
                  href={buildHref({ commentsPage: commentsPage + 1 })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-surface-sunken px-4 py-2 text-sm text-zinc-300 transition hover:border-accent/50 hover:text-accent"
                >
                  Load {COMMENTS_PAGE_SIZE} more comments
                </Link>
              </div>
            ) : comments.length > 0 ? (
              <p className="mt-4 text-center text-xs text-zinc-600">All comments shown</p>
            ) : null}
          </section>
        </>
      )}

      <p className="text-center text-sm text-zinc-500">
        <Link href="/" className="text-accent hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
