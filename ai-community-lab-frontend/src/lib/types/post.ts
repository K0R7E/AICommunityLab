export type PostRow = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  votes_count: number;
  comments_count: number;
  created_at: string;
};

export type PostWithVote = PostRow & { hasVoted: boolean };
