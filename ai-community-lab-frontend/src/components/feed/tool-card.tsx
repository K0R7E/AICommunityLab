"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { RatingControl } from "@/components/vote/rating-control";
import { TrendingBadge, getTrendingLevel } from "@/components/feed/trending-badge";
import { formatRelativeTime } from "@/lib/format";
import {
  isPostPublishedForFeed,
  moderationStatusLabel,
} from "@/lib/moderation";
import { PostCategoryBadges } from "@/components/feed/post-category-badges";
import { safeHttpExternalLink, safeHttpExternalUrl } from "@/lib/safe-external-url";
import type { PostRow } from "@/lib/types/post";

type Props = {
  post: PostRow;
  myRating: number | null;
  canVote: boolean;
  rank?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function ToolCard({ post, myRating, canVote, rank, className, style }: Props) {
  const trendingLevel = rank != null ? getTrendingLevel(rank, post.created_at) : null;
  const external = safeHttpExternalLink(post.url);
  const line = (() => {
    if (post.description?.trim()) return post.description.trim();
    const safe = safeHttpExternalUrl(post.url);
    if (safe) {
      try {
        return new URL(safe).hostname.replace(/^www\./, "");
      } catch {
        return safe;
      }
    }
    if (post.categories?.length) return post.categories.join(" · ");
    return "No description yet";
  })();

  const postHref = `/post/${post.id}`;
  const modLabel = moderationStatusLabel(post.moderation_status);
  const canRateHere = canVote && isPostPublishedForFeed(post.moderation_status);

  return (
    <article className={`card-hover group relative flex gap-2.5 overflow-hidden rounded-xl border border-zinc-800/80 bg-card p-3 transition duration-200 sm:gap-3 sm:p-4${className ? ` ${className}` : ""}`} style={style}>
      {/* Full-card hit target (comments); rating & external link sit above with z-index */}
      <Link
        href={postHref}
        className="absolute inset-0 z-0 rounded-xl outline-none ring-accent/0 transition focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-inset"
        aria-label={`${post.title} — open post and comments`}
      />

      <div className="relative z-10 flex shrink-0 flex-col items-center gap-2 self-start">
        <RatingControl
          key={`${post.id}-${post.rating_sum}-${post.rating_count}-${myRating ?? "x"}`}
          postId={post.id}
          initialRatingSum={post.rating_sum}
          initialRatingCount={post.rating_count}
          initialMyRating={myRating}
          canRate={canRateHere}
        />
      </div>

      <div className="pointer-events-none relative z-10 min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-accent sm:text-lg">
              {post.title}
            </span>
            {trendingLevel && <TrendingBadge level={trendingLevel} rank={rank!} />}
          </span>
          {external ? (
            <a
              href={external.href}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto relative z-20 inline-flex min-h-10 shrink-0 items-center gap-1 text-sm font-medium text-accent transition hover:underline"
            >
              Visit →
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : post.url?.trim() ? (
            <span className="pointer-events-auto relative z-20 shrink-0 text-sm text-zinc-500">
              Invalid URL
            </span>
          ) : (
            <span className="pointer-events-auto relative z-20 shrink-0 text-sm text-zinc-500">
              No URL
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{line}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-400">
          {modLabel ? (
            <span className="rounded-md border border-amber-800/60 bg-amber-950/35 px-2 py-0.5 text-[11px] font-medium text-amber-200">
              {modLabel}
            </span>
          ) : null}
          {post.post_kind ? (
            <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent">
              {post.post_kind}
            </span>
          ) : null}
          <PostCategoryBadges categories={post.categories ?? []} />
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" aria-hidden />
            {post.comments_count}{" "}
            {post.comments_count === 1 ? "comment" : "comments"}
          </span>
          <span>{formatRelativeTime(post.created_at)}</span>
        </div>
      </div>
    </article>
  );
}
