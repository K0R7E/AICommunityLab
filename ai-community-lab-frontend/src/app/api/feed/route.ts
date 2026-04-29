import { NextResponse } from "next/server";
import { categoryFilterFromUrlSearchParams, listingKindFromUrlSearchParams } from "@/lib/category-query";
import { getFeedPosts } from "@/lib/data/posts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") === "top" ? "top" : "new";
  const categoryLabels = categoryFilterFromUrlSearchParams(searchParams);
  const listingKind = listingKindFromUrlSearchParams(searchParams);
  const rawQ = searchParams.get("q")?.trim() || null;
  const searchQuery = rawQ && rawQ.length <= 200 ? rawQ : null;
  const cursor = searchParams.get("cursor")?.trim() || null;

  const payload = await getFeedPosts({
    sort,
    categoryLabels,
    listingKind,
    searchQuery,
    cursor,
  });

  const ratings: Record<string, number> = {};
  for (const [postId, value] of payload.myRatings.entries()) {
    ratings[postId] = value;
  }

  const STRIP_FIELDS = new Set([
    "user_id",
    "bayes_score",
    "hot_score",
    "leaderboard_score",
    "ratings_last_7d",
    "ratings_last_30d",
    "moderation_rejection_reason",
  ]);

  // Strip internal fields that have no use in the public client.
  const publicPosts = payload.posts.map((post) =>
    Object.fromEntries(
      Object.entries(post as Record<string, unknown>).filter(
        ([k]) => !STRIP_FIELDS.has(k),
      ),
    ),
  );

  return NextResponse.json({
    posts: publicPosts,
    myRatings: ratings,
    nextCursor: payload.nextCursor,
  });
}
