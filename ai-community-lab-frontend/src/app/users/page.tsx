import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Award, FileText, Users } from "lucide-react";
import { searchUsers } from "@/lib/data/users";
import { safeHttpsImageUrl } from "@/lib/safe-remote-media-url";
import { FeedSearch } from "@/components/shell/feed-search";

export const metadata: Metadata = {
  title: "Find Users · AICommunityLab",
  description: "Search and discover community members on AICommunityLab.",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const users = await searchUsers(q);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Users className="size-6 text-accent" aria-hidden />
          <h1 className="text-2xl font-bold text-zinc-100">Find Users</h1>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Search for community members by username.
        </p>
      </div>

      <Suspense fallback={null}>
        <FeedSearch
          basePath="/users"
          placeholder="Search by username…"
          aria-label="Search users"
        />
      </Suspense>

      {users.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-surface-sunken px-6 py-10 text-center text-sm text-zinc-500">
          {q ? `No users found matching "${q}".` : "No users found."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((u) => {
            const avatarUrl = safeHttpsImageUrl(u.avatar_url);
            return (
              <li key={u.id}>
                <Link
                  href={`/profile/${encodeURIComponent(u.username)}`}
                  className="flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-card p-4 transition hover:border-accent/40"
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="size-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-lg font-bold text-accent">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-100">{u.username}</p>
                    {u.bio?.trim() ? (
                      <p className="mt-0.5 line-clamp-1 text-sm text-zinc-400">
                        {u.bio.trim()}
                      </p>
                    ) : null}
                    <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <FileText className="size-3.5" aria-hidden />
                        {u.total_posts} {u.total_posts === 1 ? "tool" : "tools"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="size-3.5" aria-hidden />
                        {u.total_rating_points} rating points
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-accent">View profile →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-sm text-zinc-500">
        <Link href="/" className="text-accent hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
