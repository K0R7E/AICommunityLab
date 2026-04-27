export type PostRow = {
  id: string;
  user_id: string;
  post_kind?: "AI Engine" | "AI Agent" | string;
  title: string;
  /** Optional public site URL (may be null). */
  url: string | null;
  /** Normalized URL for deduplication (may be null). */
  url_canonical?: string | null;
  description: string | null;
  categories: string[];
  /** Sum of all user ratings (1–5 each). */
  rating_sum: number;
  /** Number of users who rated. */
  rating_count: number;
  /** Denormalized average; may be null if rating_count is 0. */
  rating_avg: number | null;
  /** Bayesian-smoothed rating to reduce low-sample volatility. */
  bayes_score?: number;
  /** Bayesian score plus recency momentum. */
  hot_score?: number;
  /** Primary score used for top/trending ordering. */
  leaderboard_score?: number;
  /** Number of rating events in the last 7 days. */
  ratings_last_7d?: number;
  /** Number of rating events in the last 30 days. */
  ratings_last_30d?: number;
  comments_count: number;
  created_at: string;
  /** Feed visibility; new posts are pending until an admin publishes. */
  moderation_status?: "pending" | "published" | "rejected" | string;
};

export type PostWithMyRating = PostRow & { myRating: number | null };
