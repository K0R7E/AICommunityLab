import { createAdminClient } from "@/lib/supabase/admin";

export type AuditLogEntry = {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  admin_username: string | null;
};

const ACTION_LABELS: Record<string, string> = {
  set_moderation_status: "Changed moderation status",
  delete_post: "Deleted post",
  delete_comment: "Deleted comment",
  update_post: "Updated post",
  update_comment: "Updated comment",
};

export function auditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export async function getAdminAuditLog(options: {
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const admin = createAdminClient();
  const limit = options.limit ?? 100;

  const { data: rows } = await admin
    .from("admin_audit_log")
    .select("id, admin_user_id, action, target_type, target_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows || rows.length === 0) return [];

  const userIds = [...new Set((rows as AuditLogEntry[]).map((r) => r.admin_user_id))];
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

  return (rows as AuditLogEntry[]).map((r) => ({
    ...r,
    admin_username: usernameMap.get(r.admin_user_id) ?? null,
  }));
}
