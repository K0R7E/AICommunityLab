export type PostRow = {
  id: string;
  user_id: string;
  title: string;
  /** Optional public site URL (may be null). */
  url: string | null;
  description: string | null;
  /** Optional https image (logo/screenshot). */
  image_url?: string | null;
  categories: string[];
  /** Sum of all user ratings (1–5 each). */
  rating_sum: number;
  /** Number of users who rated. */
  rating_count: number;
  /** Denormalized average; may be null if rating_count is 0. */
  rating_avg: number | null;
  comments_count: number;
  created_at: string;
  /** Feed visibility; new posts are pending until an admin publishes. */
  moderation_status?: "pending" | "published" | "rejected" | string;
};

export type PostWithMyRating = PostRow & { myRating: number | null };
