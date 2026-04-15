import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { RatingControl } from "@/components/vote/rating-control";
import { formatRelativeTime } from "@/lib/format";
import type { PostRow } from "@/lib/types/post";

type Props = {
  post: PostRow;
  myRating: number | null;
  canVote: boolean;
};

export function ToolCard({ post, myRating, canVote }: Props) {
  const line = (() => {
    if (post.description?.trim()) return post.description.trim();
    try {
      return new URL(post.url).hostname.replace(/^www\./, "");
    } catch {
      return post.url;
    }
  })();

  const postHref = `/post/${post.id}`;

  return (
    <article className="group relative flex gap-3 overflow-hidden rounded-xl border border-zinc-800/80 bg-[#1a1a1a] p-4 transition hover:border-[#00ff9f]/25 hover:shadow-[0_0_0_1px_rgba(0,255,159,0.06)]">
      {/* Full-card hit target (comments); rating & external link sit above with z-index */}
      <Link
        href={postHref}
        className="absolute inset-0 z-0 rounded-xl outline-none ring-[#00ff9f]/0 transition focus-visible:ring-2 focus-visible:ring-[#00ff9f]/45 focus-visible:ring-inset"
        aria-label={`${post.title} — open post and comments`}
      />

      <div className="relative z-10 shrink-0">
        <RatingControl
          key={`${post.id}-${post.rating_sum}-${post.rating_count}-${myRating ?? "x"}`}
          postId={post.id}
          initialRatingSum={post.rating_sum}
          initialRatingCount={post.rating_count}
          initialMyRating={myRating}
          canRate={canVote}
        />
      </div>

      <div className="relative z-10 min-w-0 flex-1 pointer-events-none">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="text-lg font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-[#00ff9f]">
            {post.title}
          </span>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto relative z-20 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[#00ff9f] transition hover:underline"
          >
            Visit →
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{line}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-300">
            {post.category}
          </span>
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
