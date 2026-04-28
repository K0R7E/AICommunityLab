import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolCard } from "@/components/feed/tool-card";
import {
  getCommentsByUserIdScoped,
  getPostsByUserIdScoped,
  getProfileByUsername,
  getUserProfileStatsScoped,
} from "@/lib/data/profile";
import { formatRelativeTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  safeHttpWebsiteHref,
  safeHttpsImageUrl,
} from "@/lib/safe-remote-media-url";
import { Award, FileText } from "lucide-react";
import { getCurrentUserIsAdmin } from "@/lib/admin";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profile · AICommunityLab" };
  return {
    title: `${profile.username} · AICommunityLab`,
    description: profile.bio?.slice(0, 160) ?? undefined,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user ? await getCurrentUserIsAdmin() : false;
  const includeUnpublished = Boolean(user && (user.id === profile.id || isAdmin));

  const [stats, posts, profileComments] = await Promise.all([
    getUserProfileStatsScoped(profile.id, { includeUnpublished }),
    getPostsByUserIdScoped(profile.id, { includeUnpublished }),
    getCommentsByUserIdScoped(profile.id, { includeUnpublished }),
  ]);

  const myRatings = new Map<string, number>();
  if (user && posts.length > 0) {
    const { data: rows } = await supabase
      .from("ratings")
      .select("post_id, value")
      .eq("user_id", user.id)
      .in(
        "post_id",
        posts.map((p) => p.id),
      );
    for (const row of rows ?? []) {
      myRatings.set(
        (row as { post_id: string }).post_id,
        (row as { value: number }).value,
      );
    }
  }

  const canVote = !!user;
  const avatarUrl = safeHttpsImageUrl(profile.avatar_url);
  const websiteLink = profile.website
    ? safeHttpWebsiteHref(profile.website)
    : null;

  return (
    <div>
      <div className="flex flex-col gap-6 rounded-xl border border-zinc-800/80 bg-card p-6 sm:flex-row sm:items-start">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              width={96}
              height={96}
              className="size-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-2xl font-bold text-accent">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-zinc-100">{profile.username}</h1>
          {websiteLink ? (
            <a
              href={websiteLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-accent hover:underline"
            >
              {websiteLink.label}
            </a>
          ) : profile.website?.trim() ? (
            <p className="mt-1 text-sm text-zinc-500">Invalid website URL.</p>
          ) : null}
          {profile.bio?.trim() ? (
            <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">
              {profile.bio.trim()}
            </p>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">No bio yet.</p>
          )}
          <dl className="mt-6 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-zinc-500" aria-hidden />
              <dt className="text-zinc-500">Posts</dt>
              <dd className="font-semibold tabular-nums text-zinc-200">
                {stats.totalPosts}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Award className="size-4 text-zinc-500" aria-hidden />
              <dt className="text-zinc-500">Rating points</dt>
              <dd className="font-semibold tabular-nums text-zinc-200">
                {stats.totalRatingPoints}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100">Submitted tools</h2>
        {posts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-zinc-800 bg-surface-sunken px-6 py-10 text-center text-sm text-zinc-500">
            No tools submitted yet.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {posts.map((post) => (
              <ToolCard
                key={post.id}
                post={post}
                myRating={myRatings.get(post.id) ?? null}
                canVote={canVote}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100">Comments</h2>
        {profileComments.length === 0 ? (
          <p className="mt-4 rounded-xl border border-zinc-800 bg-surface-sunken px-6 py-10 text-center text-sm text-zinc-500">
            No comments yet.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {profileComments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-800 bg-surface-sunken px-4 py-3"
              >
                <p className="line-clamp-3 whitespace-pre-wrap text-sm text-zinc-200">
                  {c.content}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  on{" "}
                  <Link
                    href={`/post/${c.post_id}`}
                    className="text-accent hover:underline"
                  >
                    {c.post_title}
                  </Link>
                  {" · "}
                  {formatRelativeTime(c.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 text-center text-sm text-zinc-500">
        <Link href="/" className="text-accent hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
