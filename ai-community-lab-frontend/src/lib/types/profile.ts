export type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
  /** Set via SQL / Dashboard; used for moderation UI. */
  is_admin?: boolean;
  /** Opt-in: notify when any community tool is published (default off). */
  notify_new_tools?: boolean;
};

export type ProfilePublic = Pick<
  ProfileRow,
  "username" | "avatar_url" | "bio" | "website" | "created_at"
>;
