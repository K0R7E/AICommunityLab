import { Suspense } from "react";
import { ToolCard } from "@/components/feed/tool-card";
import { FeedSortBar } from "@/components/shell/feed-sort";
import { getFeedPosts } from "@/lib/data/posts";

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-xl border border-zinc-800/80 bg-[#1a1a1a] p-4"
        >
          <div className="h-16 w-12 animate-pulse rounded-lg bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-800/80" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function Feed({
  sort,
  category,
}: {
  sort: "new" | "top";
  category: string | null;
}) {
  const { posts, votedIds, userId } = await getFeedPosts({ sort, category });
  const canVote = !!userId;

  if (posts.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-6 py-12 text-center text-zinc-400">
        No tools yet 😢 Be the first to share something cool
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <ToolCard
          key={post.id}
          post={post}
          hasVoted={votedIds.has(post.id)}
          canVote={canVote}
        />
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const sort = sp.sort === "top" ? "top" : "new";
  const category = sp.category?.trim() || null;

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          {sort === "top" ? "Top tools" : "Latest tools"}
        </h1>
        {category ? (
          <p className="mt-1 text-sm text-zinc-500">Category: {category}</p>
        ) : null}
      </div>
      <Suspense fallback={null}>
        <FeedSortBar />
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed sort={sort} category={category} />
      </Suspense>
    </div>
  );
}
