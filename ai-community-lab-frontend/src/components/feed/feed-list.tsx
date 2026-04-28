"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolCard } from "@/components/feed/tool-card";
import type { PostRow } from "@/lib/types/post";
import type { ListingKind } from "@/lib/constants";

type FeedResponse = {
  posts: PostRow[];
  myRatings: Record<string, number>;
  nextCursor: string | null;
};

type Props = {
  initialPosts: PostRow[];
  initialMyRatings: Record<string, number>;
  initialNextCursor: string | null;
  sort: "new" | "top";
  categoryLabels: string[];
  listingKind: ListingKind | null;
  searchQuery: string | null;
  canVote: boolean;
};

function buildFeedApiUrl(args: {
  sort: "new" | "top";
  categoryLabels: string[];
  listingKind: ListingKind | null;
  searchQuery: string | null;
  cursor: string;
}): string {
  const p = new URLSearchParams();
  p.set("sort", args.sort);
  p.set("cursor", args.cursor);
  for (const c of args.categoryLabels) p.append("category", c);
  if (args.listingKind) p.set("kind", args.listingKind);
  if (args.searchQuery?.trim()) p.set("q", args.searchQuery.trim());
  return `/api/feed?${p.toString()}`;
}

export function FeedList({
  initialPosts,
  initialMyRatings,
  initialNextCursor,
  sort,
  categoryLabels,
  listingKind,
  searchQuery,
  canVote,
}: Props) {
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [myRatings, setMyRatings] = useState<Record<string, number>>(initialMyRatings);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newItemsStart, setNewItemsStart] = useState<number | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
    setMyRatings(initialMyRatings);
    setNextCursor(initialNextCursor);
    setLoadError(null);
    setLoadingMore(false);
  }, [initialPosts, initialMyRatings, initialNextCursor]);

  const postIds = useMemo(() => new Set(posts.map((p) => p.id)), [posts]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadError(null);
    try {
      const res = await fetch(
        buildFeedApiUrl({
          sort,
          categoryLabels,
          listingKind,
          searchQuery,
          cursor: nextCursor,
        }),
        { method: "GET", cache: "no-store" },
      );
      if (!res.ok) {
        throw new Error(`Feed request failed (${res.status})`);
      }
      const payload = (await res.json()) as FeedResponse;
      const incoming = payload.posts.filter((p) => !postIds.has(p.id));
      setPosts((prev) => {
        setNewItemsStart(prev.length);
        return [...prev, ...incoming];
      });
      setMyRatings((prev) => ({ ...prev, ...(payload.myRatings ?? {}) }));
      setNextCursor(payload.nextCursor ?? null);
    } catch {
      setLoadError("Could not load more tools. Try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post, i) => {
        const isNew = newItemsStart !== null && i >= newItemsStart;
        const stagger = isNew ? (i - newItemsStart) * 60 : 0;
        return (
          <ToolCard
            key={post.id}
            post={post}
            myRating={myRatings[post.id] ?? null}
            canVote={canVote}
            rank={sort === "top" ? i + 1 : undefined}
            className={isNew ? "item-enter" : undefined}
            style={isNew ? { animationDelay: `${stagger}ms` } : undefined}
          />
        );
      })}
      {nextCursor ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-600 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-accent/45 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loadingMore ? "Loading more..." : "Load more"}
          </button>
          {loadError ? (
            <p className="mt-2 text-sm text-red-400" role="alert">
              {loadError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
