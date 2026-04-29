"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Call when rendering /notifications so the header badge only counts newer items.
 * Do not call `revalidatePath` here: this runs during RSC render and Next.js forbids
 * revalidation during render. The bell uses `/api/notifications/unread` (client refetch).
 */
export async function markNotificationInboxOpened(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ notification_inbox_seen_at: new Date().toISOString() })
    .eq("id", user.id);
}

/** Removes the notification from the inbox (no separate read state). */
export async function dismissNotification(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (error.code === "42501" || msg.includes("permission") || msg.includes("policy")) {
      return {
        error:
          "Removing notifications is currently unavailable. Please try again later.",
      };
    }
    return { error: error.message || "Could not remove notification." };
  }
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return {};
}
