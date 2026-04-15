export type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
};

export type ProfilePublic = Pick<
  ProfileRow,
  "username" | "avatar_url" | "bio" | "website" | "created_at"
>;
