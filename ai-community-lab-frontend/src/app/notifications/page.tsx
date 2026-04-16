import Link from "next/link";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { NotificationRowActions } from "./notification-row-actions";

export const metadata = {
  title: "Notifications · AICommunityLab",
};

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
    .select("id, post_id, type, read_at, created_at")
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
        }[])
      : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100">Notifications</h1>
      <p className="mt-2 text-sm text-zinc-400">
        New comments on your tools and (for moderators) every public comment for
        review appear here.
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
                  {n.type === "comment_on_post"
                    ? "New comment on your tool"
                    : n.type === "admin_new_comment"
                      ? "New comment (moderation)"
                      : n.type}
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
