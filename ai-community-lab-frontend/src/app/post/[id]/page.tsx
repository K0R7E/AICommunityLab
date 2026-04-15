import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MessageCircle } from "lucide-react";
import { RatingControl } from "@/components/vote/rating-control";
import { formatRelativeTime } from "@/lib/format";
import {
  getCommentsForPost,
  getPostById,
  getMyRatingForPost,
} from "@/lib/data/post-detail";
import { createClient } from "@/lib/supabase/server";
import { CommentForm } from "./comment-form";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "Post · AICommunityLab" };
  return { title: `${post.title} · AICommunityLab` };
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const [comments, ratingState] = await Promise.all([
    getCommentsForPost(id),
    getMyRatingForPost(id),
  ]);

  const canAct = !!currentUser;

  return (
    <article>
      <div className="flex gap-4">
        <RatingControl
          key={`${post.id}-${post.rating_sum}-${post.rating_count}-${ratingState.myRating ?? "x"}`}
          postId={post.id}
          initialRatingSum={post.rating_sum}
          initialRatingCount={post.rating_count}
          initialMyRating={ratingState.myRating}
          canRate={canAct}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight text-zinc-100">
            {post.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-300">
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-4" aria-hidden />
              {post.comments_count}{" "}
              {post.comments_count === 1 ? "comment" : "comments"}
            </span>
            <span>{formatRelativeTime(post.created_at)}</span>
          </div>
          {post.description ? (
            <p className="mt-4 text-zinc-300">{post.description}</p>
          ) : null}
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-[#00ff9f] transition hover:underline"
          >
            Visit site
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>
      </div>

      <section className="mt-12 border-t border-zinc-800 pt-8">
        <h2 className="text-lg font-semibold text-zinc-100">Comments</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {comments.length === 0 ? (
            <li className="text-sm text-zinc-500">No comments yet.</li>
          ) : (
            comments.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-zinc-800 bg-[#141414] px-4 py-3"
              >
                <p className="whitespace-pre-wrap text-sm text-zinc-200">
                  {c.content}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {formatRelativeTime(c.created_at)}
                </p>
              </li>
            ))
          )}
        </ul>
        <div className="mt-8">
          <CommentForm postId={id} canComment={canAct} />
          {!canAct ? (
            <p className="mt-3 text-sm text-zinc-500">
              <Link href="/" className="text-[#00ff9f] hover:underline">
                Sign in
              </Link>{" "}
              to comment.
            </p>
          ) : null}
        </div>
      </section>
    </article>
  );
}
