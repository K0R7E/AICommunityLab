import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { VoteButton } from "@/components/vote/vote-button";
import { formatRelativeTime } from "@/lib/format";
import type { PostRow } from "@/lib/types/post";

type Props = {
  post: PostRow;
  hasVoted: boolean;
  canVote: boolean;
};

export function ToolCard({ post, hasVoted, canVote }: Props) {
  const line = (() => {
    if (post.description?.trim()) return post.description.trim();
    try {
      return new URL(post.url).hostname.replace(/^www\./, "");
    } catch {
      return post.url;
    }
  })();

  return (
    <article className="flex gap-3 rounded-xl border border-zinc-800/80 bg-[#1a1a1a] p-4 transition hover:border-[#00ff9f]/25 hover:shadow-[0_0_0_1px_rgba(0,255,159,0.06)]">
      <VoteButton
        key={`${post.id}-${post.votes_count}-${hasVoted}`}
        postId={post.id}
        initialVotes={post.votes_count}
        initialHasVoted={hasVoted}
        canVote={canVote}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link
            href={`/post/${post.id}`}
            className="text-lg font-semibold leading-snug text-zinc-100 transition hover:text-[#00ff9f]"
          >
            {post.title}
          </Link>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[#00ff9f] transition hover:underline"
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
