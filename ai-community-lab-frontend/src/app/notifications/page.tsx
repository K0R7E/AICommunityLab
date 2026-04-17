import Link from "next/link";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { markNotificationInboxOpened } from "./actions";
import { NotificationRowActions } from "./notification-row-actions";

export const metadata = {
  title: "Notifications · AICommunityLab",
};

function notificationTitle(n: {
  type: string;
  batch_count: number | null;
}): string {
  const count = n.batch_count ?? 1;
  switch (n.type) {
    case "comment_on_post":
      return "New comment on your tool";
    case "admin_new_comment":
      return "New comment (moderation)";
    case "admin_post_comments_digest":
      return count === 1
        ? "New comment on a post (moderation)"
        : `${count} new comments on one post (moderation)`;
    case "admin_new_post":
      return "New submission to review";
    case "your_post_published":
      return "Your tool was published";
    case "new_tool_in_feed":
      return "New tool in the feed";
    case "post_rejected":
      return "Your submission was not approved";
    case "comment_removed":
      return "Your comment was removed by a moderator";
    default:
      return n.type;
  }
}

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 500);
}

const PAGE_SIZE = 100;

function pageHref(page: number): string {
  if (page <= 1) return "/notifications";
  return `/notifications?page=${page}`;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = parsePage(sp.page);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/notifications");
  }

  await markNotificationInboxOpened();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("notifications")
    .select("id, post_id, type, created_at, batch_count, message", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const rows =
    !error && data
      ? (data as {
          id: string;
          post_id: string | null;
          type: string;
          created_at: string;
          batch_count: number | null;
          message: string | null;
        }[])
      : [];

  const total = typeof count === "number" ? count : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext =
    typeof count === "number"
      ? page * PAGE_SIZE < count
      : rows.length === PAGE_SIZE;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100">Notifications</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Comments on your posts, status on your submissions, optional alerts when
        new tools go live, and a moderation queue for admins (grouped by post so
        busy threads do not spam your inbox). Dismiss a row to remove it from your
        inbox.
      </p>

      {rows.length > 0 ? (
        <p className="mt-4 text-xs text-zinc-500">
          {typeof count === "number" ? (
            <>
              Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + rows.length} of{" "}
              {total} (newest first). Use <span className="text-zinc-400">Older / Newer</span>{" "}
              below for more pages.
            </>
          ) : (
            <>Showing {rows.length} on this page (page {page}).</>
          )}
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-2">
        {rows.length === 0 ? (
          <li className="rounded-lg border border-zinc-800 bg-[#141414] px-4 py-8 text-center text-sm text-zinc-500">
            No notifications yet.
          </li>
        ) : (
          rows.map((n) => (
            <li
              key={n.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-[#141414] px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-zinc-200">
                  {notificationTitle(n)}
                </p>
                {n.message ? (
                  <p className="mt-2 whitespace-pre-wrap rounded-md border border-zinc-800/80 bg-[#0f0f0f] px-2 py-1.5 text-xs text-zinc-300">
                    {n.message}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-zinc-500">
                  {formatRelativeTime(n.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {n.post_id ? (
                  <Link
                    href={`/post/${n.post_id}`}
                    className="text-sm font-medium text-[#00ff9f] hover:underline"
                  >
                    Open post
                  </Link>
                ) : null}
                <NotificationRowActions id={n.id} />
              </div>
            </li>
          ))
        )}
      </ul>

      {rows.length > 0 && (hasPrev || hasNext) ? (
        <nav
          className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-6 text-sm"
          aria-label="Notification pages"
        >
          <div>
            {hasPrev ? (
              <Link href={pageHref(page - 1)} className="font-medium text-[#00ff9f] hover:underline">
                ← Newer
              </Link>
            ) : (
              <span className="text-zinc-600">← Newer</span>
            )}
          </div>
          <p className="text-zinc-500">
            Page {page} of {totalPages}
          </p>
          <div>
            {hasNext ? (
              <Link href={pageHref(page + 1)} className="font-medium text-[#00ff9f] hover:underline">
                Older →
              </Link>
            ) : (
              <span className="text-zinc-600">Older →</span>
            )}
          </div>
        </nav>
      ) : null}

      <p className="mt-10 text-center text-sm text-zinc-500">
        <Link href="/" className="text-[#00ff9f] hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
