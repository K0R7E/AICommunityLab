import Link from "next/link";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
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
    default:
      return n.type;
  }
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/notifications");
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, post_id, type, read_at, created_at, batch_count")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  const rows =
    !error && data
      ? (data as {
          id: string;
          post_id: string | null;
          type: string;
          read_at: string | null;
          created_at: string;
          batch_count: number | null;
        }[])
      : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100">Notifications</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Comments on your posts, status on your submissions, optional alerts when
        new tools go live, and a moderation queue for admins (grouped by post so
        busy threads do not spam your inbox).
      </p>
      <ul className="mt-8 flex flex-col gap-2">
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
                <p className="mt-1 text-xs text-zinc-500">
                  {formatRelativeTime(n.created_at)}
                  {n.read_at ? " · Read" : ""}
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
                {!n.read_at ? <NotificationRowActions id={n.id} /> : null}
              </div>
            </li>
          ))
        )}
      </ul>
      <p className="mt-10 text-center text-sm text-zinc-500">
        <Link href="/" className="text-[#00ff9f] hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
