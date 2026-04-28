import { Suspense } from "react";
import Link from "next/link";
import { FeedList } from "@/components/feed/feed-list";
import { FeedSearch } from "@/components/shell/feed-search";
import { FeedSortBar } from "@/components/shell/feed-sort";
import { EmptyFeed, EmptyCategory, EmptySearch } from "@/components/feed/empty-state";
import { categoryFilterFromSearchParams, listingKindFromSearchParams } from "@/lib/category-query";
import { getFeedPosts } from "@/lib/data/posts";
import { createClient } from "@/lib/supabase/server";
import { POST_MODERATION_PUBLISHED } from "@/lib/moderation";
import type { ListingKind } from "@/lib/constants";
import { Flame } from "lucide-react";

type TrendingPost = {
  id: string;
  title: string;
  rating_avg: number | null;
  rating_count: number;
  leaderboard_score: number;
};

async function getTrendingPosts(): Promise<TrendingPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, rating_avg, rating_count, leaderboard_score, bayes_score")
    .eq("moderation_status", POST_MODERATION_PUBLISHED)
    .order("leaderboard_score", { ascending: false, nullsFirst: false })
    .order("bayes_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(5);
  return (data ?? []) as TrendingPost[];
}

const RANK_STYLES = [
  // #1 — gold glow
  "border-[#f59e0b]/40 bg-gradient-to-br from-[#f59e0b]/10 to-surface-sunken shadow-[0_0_18px_-4px_rgba(245,158,11,0.25)]",
  // #2 — silver
  "border-zinc-500/30 bg-gradient-to-br from-zinc-500/8 to-surface-sunken",
  // #3 — bronze
  "border-[#cd7f32]/30 bg-gradient-to-br from-[#cd7f32]/8 to-surface-sunken",
  // #4-5
  "border-zinc-800/80 bg-surface-sunken",
  "border-zinc-800/80 bg-surface-sunken",
] as const;

const RANK_NUMBER_STYLES = [
  "text-[#f59e0b]",
  "text-zinc-400",
  "text-[#cd7f32]",
  "text-zinc-600",
  "text-zinc-600",
] as const;

async function TrendingStrip() {
  const posts = await getTrendingPosts();
  if (posts.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Flame className="size-5 text-[#ff5cf0]" aria-hidden />
          <span className="bg-gradient-to-r from-[#ff5cf0] via-[#ff9f5c] to-[#00ff9f] bg-clip-text text-sm font-bold uppercase tracking-[0.18em] text-transparent">
            Trending Now
          </span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-[#ff5cf0]/25 via-[#00ff9f]/10 to-transparent" />
      </div>

      {/* Cards — horizontal scroll on mobile, flex wrap on desktop */}
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-nowrap lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className={`group relative flex-none w-[160px] sm:w-[180px] lg:flex-1 lg:w-auto rounded-xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${RANK_STYLES[i] ?? RANK_STYLES[4]}`}
          >
            {/* Faded rank number background */}
            <span
              aria-hidden
              className="pointer-events-none absolute right-2 top-0 select-none font-black leading-none text-[4rem] opacity-[0.07]"
            >
              {i + 1}
            </span>

            {/* Rank badge */}
            <span className={`mb-3 block text-xs font-black tabular-nums ${RANK_NUMBER_STYLES[i] ?? RANK_NUMBER_STYLES[4]}`}>
              #{i + 1}
            </span>

            <p className="relative line-clamp-2 text-sm font-semibold leading-snug text-zinc-200 transition group-hover:text-accent">
              {post.title}
            </p>

            {post.rating_avg != null ? (
              <p className="mt-2.5 flex items-center gap-1 text-xs text-zinc-500">
                <span className="text-[#f59e0b]">★</span>
                <span>{Number(post.rating_avg).toFixed(1)}</span>
                <span className="text-zinc-700">·</span>
                <span>{post.rating_count} votes</span>
              </p>
            ) : (
              <p className="mt-2.5 text-xs text-zinc-600">No ratings yet</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-xl border border-zinc-800/80 bg-card p-4"
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
  categoryLabels,
  listingKind,
  searchQuery,
  cursor,
}: {
  sort: "new" | "top";
  categoryLabels: string[];
  listingKind: ListingKind | null;
  searchQuery: string | null;
  cursor: string | null;
}) {
  const { posts, myRatings, userId, nextCursor } = await getFeedPosts({
    sort,
    categoryLabels,
    listingKind,
    searchQuery,
    cursor,
  });
  const canVote = !!userId;

  if (posts.length === 0) {
    if (searchQuery?.trim()) return <EmptySearch query={searchQuery.trim()} />;
    if (categoryLabels.length > 0 || listingKind) return <EmptyCategory />;
    return <EmptyFeed />;
  }

  const ratings: Record<string, number> = {};
  for (const [postId, value] of myRatings.entries()) ratings[postId] = value;
  const feedKey = [
    sort,
    listingKind ?? "all",
    searchQuery?.trim() ?? "",
    categoryLabels.join("|"),
    cursor ?? "",
  ].join("::");

  return (
    <FeedList
      key={feedKey}
      initialPosts={posts}
      initialMyRatings={ratings}
      initialNextCursor={nextCursor}
      sort={sort}
      categoryLabels={categoryLabels}
      listingKind={listingKind}
      searchQuery={searchQuery}
      canVote={canVote}
    />
  );
}


export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    category?: string | string[];
    kind?: string;
    q?: string;
    cursor?: string;
  }>;
}) {
  const sp = await searchParams;
  const sort = sp.sort === "new" ? "new" : "top";
  const categoryLabels = categoryFilterFromSearchParams(sp);
  const listingKind = listingKindFromSearchParams(sp);
  const q = sp.q?.trim() || null;
  const cursor = sp.cursor?.trim() || null;
  const categorySummary =
    categoryLabels.length > 0 ? categoryLabels.join(", ") : null;

  const clearCategoryHref = (() => {
    const p = new URLSearchParams();
    if (sort === "top") p.set("sort", "top");
    if (listingKind) p.set("kind", listingKind);
    if (q) p.set("q", q);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  })();

  return (
    <div>
      {/* Trending strip — only on default feed (no search, no category filter) */}
      {!q && categoryLabels.length === 0 && !listingKind ? (
        <Suspense fallback={<div className="mb-8 h-40 animate-pulse rounded-xl bg-zinc-800/40" />}>
          <TrendingStrip />
        </Suspense>
      ) : null}

      <div className="mb-2">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">
          {q
            ? "Search"
            : sort === "top"
              ? "Top AI tools"
              : "Latest AI tools"}
        </h1>
        {q ? (
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
            <span>
              Results for &quot;{q}&quot;
              {listingKind ? <span className="text-zinc-500"> · {listingKind}</span> : null}
              {categorySummary ? <span className="text-zinc-500"> · {categorySummary}</span> : null}
            </span>
            {categorySummary ? (
              <Link
                href={clearCategoryHref}
                className="inline-flex min-h-8 items-center rounded-md border border-zinc-600 px-2 py-0.5 text-xs font-medium text-accent transition hover:bg-zinc-800/80"
              >
                Clear categories
              </Link>
            ) : null}
          </p>
        ) : categorySummary ? (
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
            <span>
              {listingKind ? `Type: ${listingKind} · ` : ""}
              Categories: {categorySummary}
            </span>
            <Link
              href={clearCategoryHref}
              className="inline-flex min-h-8 items-center rounded-md border border-zinc-600 px-2 py-0.5 text-xs font-medium text-accent transition hover:bg-zinc-800/80"
            >
              Clear categories
            </Link>
          </p>
        ) : null}
      </div>
      <Suspense fallback={null}>
        <FeedSearch basePath="/" sticky />
      </Suspense>
      <Suspense fallback={null}>
        <FeedSortBar />
      </Suspense>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed
          sort={sort}
          categoryLabels={categoryLabels}
          listingKind={listingKind}
          searchQuery={q}
          cursor={cursor}
        />
      </Suspense>
    </div>
  );
}
