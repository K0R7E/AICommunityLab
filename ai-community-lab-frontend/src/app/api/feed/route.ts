import { NextResponse } from "next/server";
import { categoryFilterFromUrlSearchParams, listingKindFromUrlSearchParams } from "@/lib/category-query";
import { getFeedPosts } from "@/lib/data/posts";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// IP-based rate limiter — fixed window, resets every WINDOW_MS.
// Module-level state persists across warm invocations of this serverless
// function instance. Not cluster-global, but meaningfully limits abuse per
// instance without requiring external infrastructure.
// ---------------------------------------------------------------------------
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

type RLEntry = { count: number; start: number };
const ipRequests = new Map<string, RLEntry>();

function clientIp(request: Request): string {
  const h = request.headers as Headers;
  // x-real-ip is injected by Vercel/nginx, not spoofable by the client.
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  // x-forwarded-for: "client, proxy1, proxy2" — rightmost entry is added by
  // the last trusted proxy (Vercel Edge), not by the client.
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",").at(-1)?.trim() ?? "unknown";
  return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = ipRequests.get(ip);

  if (!entry || now - entry.start >= WINDOW_MS) {
    ipRequests.set(ip, { count: 1, start: now });
    // Evict stale entries to prevent unbounded memory growth.
    if (ipRequests.size > 10_000) {
      const cutoff = now - WINDOW_MS;
      for (const [k, v] of ipRequests) {
        if (v.start < cutoff) ipRequests.delete(k);
      }
    }
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.start + WINDOW_MS - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

export async function GET(request: Request) {
  const { allowed, retryAfter } = checkRateLimit(clientIp(request));
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Window": "60",
        },
      },
    );
  }
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
    "community_fallback_notified_at",
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
