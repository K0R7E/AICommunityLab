import Link from "next/link";
import { formatRelativeTime } from "@/lib/format";
import {
  getUserActivityLog,
  activityEventLabel,
  type EventCategory,
} from "@/lib/data/admin-user-activity";

const EVENT_COLORS: Record<string, string> = {
  login:           "bg-emerald-900/50 text-emerald-300",
  logout:          "bg-zinc-800 text-zinc-400",
  post_created:    "bg-blue-900/50 text-blue-300",
  comment_created: "bg-indigo-900/50 text-indigo-300",
  rating_given:    "bg-purple-900/50 text-purple-300",
  rating_removed:  "bg-zinc-800 text-zinc-400",
  profile_updated: "bg-amber-900/50 text-amber-300",
  terms_accepted:  "bg-teal-900/50 text-teal-300",
  account_deleted: "bg-red-900/50 text-red-300",
};

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "all",     label: "All" },
  { value: "auth",    label: "Auth" },
  { value: "content", label: "Content" },
  { value: "account", label: "Account" },
];

function EventBadge({ event }: { event: string }) {
  const cls = EVENT_COLORS[event] ?? "bg-zinc-800 text-zinc-300";
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {activityEventLabel(event)}
    </span>
  );
}

function MetadataSnippet({ meta }: { meta: Record<string, unknown> | null }) {
  if (!meta) return null;
  const pairs = Object.entries(meta)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${String(v)}`);
  if (pairs.length === 0) return null;
  return (
    <p className="mt-0.5 truncate font-mono text-xs text-zinc-500" title={pairs.join(" · ")}>
      {pairs.join(" · ")}
    </p>
  );
}

export async function AdminUserActivityView({
  category,
  userSearch,
}: {
  category: EventCategory;
  userSearch: string | null;
}) {
  const entries = await getUserActivityLog({
    limit: 150,
    category,
    userId: null,
  });

  const filtered = userSearch
    ? entries.filter(
        (e) =>
          e.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
          e.user_id?.includes(userSearch),
      )
    : entries;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">User activity</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Last 150 events — login, content, and account changes.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/admin?view=activity${c.value !== "all" ? `&category=${c.value}` : ""}${userSearch ? `&u=${encodeURIComponent(userSearch)}` : ""}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              category === c.value
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <li className="text-sm text-zinc-500">No activity found.</li>
        ) : (
          filtered.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-zinc-800 bg-surface-sunken px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <EventBadge event={entry.event_type} />
                    {entry.username ? (
                      <Link
                        href={`/profile/${entry.username}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        {entry.username}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-zinc-500">
                        {entry.user_id ?? "deleted user"}
                      </span>
                    )}
                  </div>
                  <MetadataSnippet meta={entry.metadata} />
                </div>
                <div className="shrink-0 text-right text-xs text-zinc-500">
                  {entry.ip_address && (
                    <p className="font-mono">{entry.ip_address}</p>
                  )}
                  <p className="mt-0.5">{formatRelativeTime(entry.created_at)}</p>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
