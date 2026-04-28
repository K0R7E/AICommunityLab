import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";

export type UserEventType =
  | "login"
  | "logout"
  | "profile_updated"
  | "terms_accepted"
  | "account_deleted";

export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return null;
}

export async function logUserActivity(
  userId: string,
  eventType: UserEventType,
  metadata?: Record<string, unknown>,
  ipAddress?: string | null,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("user_activity_log").insert({
      user_id: userId,
      event_type: eventType,
      metadata: metadata ?? null,
      ip_address: ipAddress ?? null,
    });
  } catch {
    // Logging must never break the calling flow.
  }
}
