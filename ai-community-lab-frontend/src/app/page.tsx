import { Suspense } from "react";
import Link from "next/link";
import { FeedList } from "@/components/feed/feed-list";
import { FeedSearch } from "@/components/shell/feed-search";
import { FeedSortBar } from "@/components/shell/feed-sort";
import { categoryFilterFromSearchParams, listingKindFromSearchParams } from "@/lib/category-query";
import { getFeedPosts } from "@/lib/data/posts";
import type { ListingKind } from "@/lib/constants";

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
    if (searchQuery?.trim()) {
      return (
        <p className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-6 py-12 text-center text-zinc-400">
          No results for &quot;{searchQuery.trim()}&quot;. Try different words or
          clear the search.
        </p>
      );
    }
    return (
      <p className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-6 py-12 text-center text-zinc-400">
        No tools yet 😢 Be the first to share something cool
      </p>
    );
  }

  const ratings: Record<string, number> = {};
  for (const [postId, value] of myRatings.entries()) ratings[postId] = value;

  return (
    <FeedList
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
  const sort = sp.sort === "top" ? "top" : "new";
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
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          {q
            ? "Search"
            : sort === "top"
              ? "Top tools"
              : "Latest tools"}
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
                className="rounded-md border border-zinc-600 px-2 py-0.5 text-xs font-medium text-[#00ff9f] transition hover:bg-zinc-800/80"
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
              className="rounded-md border border-zinc-600 px-2 py-0.5 text-xs font-medium text-[#00ff9f] transition hover:bg-zinc-800/80"
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
