import { createAdminClient } from "@/lib/supabase/admin";

export type UserActivityEntry = {
  id: string;
  user_id: string | null;
  event_type: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  username: string | null;
};

const EVENT_LABELS: Record<string, string> = {
  login:            "Login",
  logout:           "Logout",
  post_created:     "Post created",
  comment_created:  "Comment created",
  rating_given:     "Rating given",
  rating_removed:   "Rating removed",
  profile_updated:  "Profile updated",
  terms_accepted:   "Terms accepted",
  account_deleted:  "Account deleted",
};

export function activityEventLabel(event: string): string {
  return EVENT_LABELS[event] ?? event;
}

export type EventCategory = "all" | "auth" | "content" | "account";

const CATEGORY_EVENTS: Record<EventCategory, string[]> = {
  all:     [],
  auth:    ["login", "logout"],
  content: ["post_created", "comment_created", "rating_given", "rating_removed"],
  account: ["profile_updated", "terms_accepted", "account_deleted"],
};

export async function getUserActivityLog(options: {
  limit?: number;
  userId?: string | null;
  category?: EventCategory;
}): Promise<{ entries: UserActivityEntry[]; error: string | null }> {
  try {
    const admin = createAdminClient();
    const limit = options.limit ?? 150;

    let query = admin
      .from("user_activity_log")
      .select("id, user_id, event_type, metadata, ip_address, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options.userId) {
      query = query.eq("user_id", options.userId);
    }

    const events = CATEGORY_EVENTS[options.category ?? "all"];
    if (events.length > 0) {
      query = query.in("event_type", events);
    }

    const { data: rows, error } = await query;
    if (error) return { entries: [], error: error.message };
    if (!rows || rows.length === 0) return { entries: [], error: null };

    const userIds = [
      ...new Set(
        (rows as UserActivityEntry[])
          .map((r) => r.user_id)
          .filter((id): id is string => id !== null),
      ),
    ];

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    const usernameMap = new Map<string, string>();
    for (const p of profiles ?? []) {
      usernameMap.set(
        (p as { id: string; username: string }).id,
        (p as { id: string; username: string }).username,
      );
    }

    return {
      entries: (rows as UserActivityEntry[]).map((r) => ({
        ...r,
        username: r.user_id ? (usernameMap.get(r.user_id) ?? null) : null,
      })),
      error: null,
    };
  } catch (e) {
    return { entries: [], error: e instanceof Error ? e.message : "Unknown error" };
  }
}
