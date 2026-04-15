export type PostRow = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  /** Sum of all user ratings (1–5 each). */
  rating_sum: number;
  /** Number of users who rated. */
  rating_count: number;
  /** Denormalized average; may be null if rating_count is 0. */
  rating_avg: number | null;
  comments_count: number;
  created_at: string;
};

export type PostWithMyRating = PostRow & { myRating: number | null };
