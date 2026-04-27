import { NextResponse } from "next/server";
import { categoryFilterFromUrlSearchParams, listingKindFromUrlSearchParams } from "@/lib/category-query";
import { getFeedPosts } from "@/lib/data/posts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") === "top" ? "top" : "new";
  const categoryLabels = categoryFilterFromUrlSearchParams(searchParams);
  const listingKind = listingKindFromUrlSearchParams(searchParams);
  const searchQuery = searchParams.get("q")?.trim() || null;
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

  return NextResponse.json({
    posts: payload.posts,
    myRatings: ratings,
    nextCursor: payload.nextCursor,
  });
}
