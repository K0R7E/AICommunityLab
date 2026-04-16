import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink, MessageCircle } from "lucide-react";
import { RatingControl } from "@/components/vote/rating-control";
import { formatRelativeTime } from "@/lib/format";
import {
  getCommentsForPost,
  getPostById,
  getMyRatingForPost,
} from "@/lib/data/post-detail";
import { createClient } from "@/lib/supabase/server";
import { PostCategoryBadges } from "@/components/feed/post-category-badges";
import { safeHttpExternalLink } from "@/lib/safe-external-url";
import { CommentForm } from "./comment-form";
import { PublishedToast } from "./published-toast";
import { isPostPublishedForFeed, moderationStatusLabel } from "@/lib/moderation";
import { safeHttpsImageUrl } from "@/lib/safe-remote-media-url";

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
  const visitLink = safeHttpExternalLink(post.url);
  const thumb = safeHttpsImageUrl(post.image_url);
  const feedPublished = isPostPublishedForFeed(post.moderation_status);
  const modBanner = moderationStatusLabel(post.moderation_status);
  const modRejected = post.moderation_status === "rejected";

  return (
    <article>
      <Suspense fallback={null}>
        <PublishedToast />
      </Suspense>
      {modBanner ? (
        <div
          className={
            modRejected
              ? "mb-6 rounded-lg border border-red-900/50 bg-red-950/25 px-4 py-3 text-sm text-red-100"
              : "mb-6 rounded-lg border border-amber-800/50 bg-amber-950/25 px-4 py-3 text-sm text-amber-100"
          }
          role="status"
        >
          <p className="font-medium">{modBanner}</p>
          <p
            className={
              modRejected ? "mt-1 text-red-200/90" : "mt-1 text-amber-200/90"
            }
          >
            {modRejected
              ? "This tool was not approved for the public feed. You can still see it on your profile; contact a moderator if this is a mistake."
              : "This page is only visible to you, moderators, and admins until it is approved. Voting and comments open on the public feed after approval."}
          </p>
        </div>
      ) : null}
      <div className="flex gap-4">
        <RatingControl
          key={`${post.id}-${post.rating_sum}-${post.rating_count}-${ratingState.myRating ?? "x"}`}
          postId={post.id}
          initialRatingSum={post.rating_sum}
          initialRatingCount={post.rating_count}
          initialMyRating={ratingState.myRating}
          canRate={canAct && feedPublished}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight text-zinc-100">
            {post.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <PostCategoryBadges categories={post.categories ?? []} />
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-4" aria-hidden />
              {post.comments_count}{" "}
              {post.comments_count === 1 ? "comment" : "comments"}
            </span>
            <span>{formatRelativeTime(post.created_at)}</span>
          </div>
          {thumb ? (
            <div className="mt-4 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb}
                alt=""
                width={800}
                height={400}
                className="max-h-64 w-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}
          {post.description ? (
            <p className="mt-4 text-zinc-300">{post.description}</p>
          ) : null}
          {visitLink ? (
            <a
              href={visitLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-[#00ff9f] transition hover:underline"
            >
              Visit site
              <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : post.url?.trim() ? (
            <p className="mt-4 text-sm text-zinc-500">
              External link is not a valid http(s) URL.
            </p>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">No site URL was added for this tool.</p>
          )}
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
          <CommentForm
            postId={id}
            signedIn={canAct}
            canComment={canAct && feedPublished}
          />
          {!canAct ? (
            <p className="mt-3 text-sm text-zinc-500">
              <Link href="/" className="text-[#00ff9f] hover:underline">
                Sign in
              </Link>{" "}
              to comment.
            </p>
          ) : !feedPublished ? (
            <p className="mt-3 text-sm text-zinc-500">
              Comments open after a moderator approves this tool for the public
              feed.
            </p>
          ) : null}
        </div>
      </section>
    </article>
  );
}
