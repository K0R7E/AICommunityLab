import Link from "next/link";
import { formatRelativeTime } from "@/lib/format";
import { getAdminAuditLog, auditActionLabel } from "@/lib/data/admin-audit-log";

const TARGET_TYPE_LABELS: Record<string, string> = {
  post: "Post",
  comment: "Comment",
};

function DetailsBadge({ details }: { details: Record<string, unknown> | null }) {
  if (!details || Object.keys(details).length === 0) return null;
  const pairs = Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${String(v)}`);
  if (pairs.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-zinc-500 font-mono truncate" title={pairs.join(" · ")}>
      {pairs.join(" · ")}
    </p>
  );
}

export async function AdminAuditLogView() {
  const entries = await getAdminAuditLog({ limit: 150 });

  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-100">Audit log</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Last 150 admin actions, newest first.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {entries.length === 0 ? (
          <li className="text-sm text-zinc-500">No audit log entries yet.</li>
        ) : (
          entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-zinc-800 bg-surface-sunken px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-100">
                    {auditActionLabel(entry.action)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                      {TARGET_TYPE_LABELS[entry.target_type] ?? entry.target_type}
                    </span>
                    {entry.target_id && entry.target_type === "post" ? (
                      <Link
                        href={`/post/${entry.target_id}`}
                        className="font-mono text-accent hover:underline"
                      >
                        {entry.target_id}
                      </Link>
                    ) : entry.target_id ? (
                      <span className="font-mono">{entry.target_id}</span>
                    ) : null}
                  </div>
                  <DetailsBadge details={entry.details} />
                </div>
                <div className="shrink-0 text-right text-xs text-zinc-500">
                  <p>{entry.admin_username ?? entry.admin_user_id}</p>
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
