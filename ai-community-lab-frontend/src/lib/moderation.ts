export const POST_MODERATION_PUBLISHED = "published" as const;

export type PostModerationStatus = "pending" | "published" | "rejected";

/** Treat missing status as published (pre-migration / legacy rows). */
export function isPostPublishedForFeed(
  status: string | null | undefined,
): boolean {
  if (status == null || status === "") return true;
  return status === POST_MODERATION_PUBLISHED;
}

export function moderationStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "pending":
      return "Pending review";
    case "rejected":
      return "Rejected";
    case "published":
      return "";
    default:
      return "";
  }
}
