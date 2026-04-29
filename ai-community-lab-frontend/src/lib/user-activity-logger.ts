import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";

export type UserEventType =
  | "login"
  | "logout"
  | "profile_updated"
  | "terms_accepted"
  | "account_deleted";

export function getClientIp(request: NextRequest): string | null {
  // x-real-ip is injected by Vercel/nginx and is not forwarded from clients.
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // x-forwarded-for: "client, proxy1, proxy2" — take the rightmost entry,
  // which is appended by the last trusted proxy (Vercel Edge), not by the client.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const last = forwarded.split(",").at(-1)?.trim();
    return last || null;
  }
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
