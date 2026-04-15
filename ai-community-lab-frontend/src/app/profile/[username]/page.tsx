import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolCard } from "@/components/feed/tool-card";
import {
  getPostsByUserId,
  getProfileByUsername,
  getUserProfileStats,
} from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import { Award, FileText } from "lucide-react";

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

  const [stats, posts] = await Promise.all([
    getUserProfileStats(profile.id),
    getPostsByUserId(profile.id),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let votedIds = new Set<string>();
  if (user && posts.length > 0) {
    const { data: votes } = await supabase
      .from("votes")
      .select("post_id")
      .eq("user_id", user.id)
      .in(
        "post_id",
        posts.map((p) => p.id),
      );
    votedIds = new Set(votes?.map((v) => v.post_id as string) ?? []);
  }

  const canVote = !!user;
  const avatarUrl = profile.avatar_url?.trim();

  return (
    <div>
      <div className="flex flex-col gap-6 rounded-xl border border-zinc-800/80 bg-[#1a1a1a] p-6 sm:flex-row sm:items-start">
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
            <div className="flex size-full items-center justify-center text-2xl font-bold text-[#00ff9f]">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-zinc-100">{profile.username}</h1>
          {profile.website ? (
            <a
              href={
                profile.website.startsWith("http")
                  ? profile.website
                  : `https://${profile.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-[#00ff9f] hover:underline"
            >
              {profile.website.replace(/^https?:\/\//, "")}
            </a>
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
              <dt className="text-zinc-500">Upvotes received</dt>
              <dd className="font-semibold tabular-nums text-zinc-200">
                {stats.totalUpvotesReceived}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-100">Submitted tools</h2>
        {posts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-zinc-800 bg-[#141414] px-6 py-10 text-center text-sm text-zinc-500">
            No tools submitted yet.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {posts.map((post) => (
              <ToolCard
                key={post.id}
                post={post}
                hasVoted={votedIds.has(post.id)}
                canVote={canVote}
              />
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 text-center text-sm text-zinc-500">
        <Link href="/" className="text-[#00ff9f] hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
