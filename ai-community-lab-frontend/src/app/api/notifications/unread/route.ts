import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_inbox_seen_at")
    .eq("id", user.id)
    .maybeSingle();

  const seenAt = (profile as { notification_inbox_seen_at?: string | null } | null)
    ?.notification_inbox_seen_at;

  let notifQuery = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (seenAt) {
    notifQuery = notifQuery.gt("created_at", seenAt);
  }

  const { count, error } = await notifQuery;

  if (error) {
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
