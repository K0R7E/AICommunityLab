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
  /** Opt-in: notify when someone comments on one of your tools (default on). */
  notify_comments_on_tools?: boolean;
  /** Opt-in: notify about moderation outcomes and moderator actions (default on). */
  notify_moderation_updates?: boolean;
  /** Last time the user opened the notifications inbox (badge uses this). */
  notification_inbox_seen_at?: string | null;
  /** First-login consent gate: true once the user has accepted Terms + Privacy. */
  has_accepted_terms?: boolean;
  /** Timestamp of the latest acceptance. */
  accepted_terms_at?: string | null;
  /** Version string of the terms the user accepted (for re-consent on changes). */
  accepted_terms_version?: string | null;
};

export type ProfilePublic = Pick<
  ProfileRow,
  "username" | "avatar_url" | "bio" | "website" | "created_at"
>;
