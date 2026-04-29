"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalToolUrl } from "@/lib/canonical-tool-url";
import { normalizeUserText } from "@/lib/normalize-user-text";
import {
  parseCategoriesFromFormData,
  parseListingKindFromFormData,
  parseOptionalPostUrl,
} from "@/lib/post-form";

function forbidden(): { error: string } {
  return { error: "Not allowed." };
}

async function requireAdmin(): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return forbidden();

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!((data as { is_admin?: boolean } | null)?.is_admin)) return forbidden();
  return { supabase, userId: user.id };
}

async function logAdminAction(
  adminUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      admin_user_id: adminUserId,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details ?? null,
    });
  } catch {
    // Audit log failures must not block the admin operation.
  }
}

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const URL_MAX = 2048;
const DESCRIPTION_MAX = 10_000;
const COMMENT_MAX = 8000;

export async function adminSetPostModerationStatus(
  postId: string,
  status: "published" | "rejected" | "pending",
  rejectionReason?: string | null,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  if (status !== "published" && status !== "rejected" && status !== "pending") {
    return { error: "Invalid status." };
  }
  const { supabase, userId } = auth;
  const trimmed = rejectionReason?.trim() || null;
  const patch =
    status === "rejected"
      ? { moderation_status: status, moderation_rejection_reason: trimmed }
      : { moderation_status: status, moderation_rejection_reason: null };
  const { error } = await supabase.from("posts").update(patch).eq("id", postId);
  if (error) return { error: "Could not update moderation status." };
  await logAdminAction(userId, "set_moderation_status", "post", postId, {
    status,
    rejectionReason: trimmed,
  });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/post/${postId}`);
  return {};
}

export async function adminDeletePost(postId: string): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const { supabase, userId } = auth;
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: "Could not delete post." };
  await logAdminAction(userId, "delete_post", "post", postId);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/post/${postId}`);
  return {};
}

export async function adminDeleteComment(
  commentId: string,
  postId: string,
  moderatorNote?: string | null,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const { supabase, userId } = auth;

  const { data: row } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .maybeSingle();

  const authorId = (row as { user_id?: string } | null)?.user_id;
  if (authorId && authorId !== userId) {
    // Use the admin client (service_role) so we can insert a notification for
    // the comment author without going through the moderation_push_notification
    // RPC. That RPC's authenticated grant has been revoked (migration 009).
    const admin = createAdminClient();
    const { data: prefs } = await admin
      .from("profiles")
      .select("notify_moderation_updates")
      .eq("id", authorId)
      .maybeSingle();
    const wantsNotification =
      (prefs as { notify_moderation_updates?: boolean | null } | null)
        ?.notify_moderation_updates !== false;
    if (wantsNotification) {
      const { error: notifyError } = await admin.from("notifications").insert({
        user_id: authorId,
        type: "comment_removed",
        post_id: postId,
        message: moderatorNote?.trim() || null,
      });
      if (notifyError) {
        return { error: "Could not notify the comment author. Please try again." };
      }
    }
  }

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: "Could not delete comment." };
  await logAdminAction(userId, "delete_comment", "comment", commentId, {
    postId,
    moderatorNote: moderatorNote?.trim() || null,
  });
  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin");
  return {};
}

export async function adminUpdatePost(
  postId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const title = normalizeUserText(String(formData.get("title") ?? ""));
  const description = normalizeUserText(String(formData.get("description") ?? ""));

  const kindParsed = parseListingKindFromFormData(formData);
  if (!kindParsed.ok) {
    return { error: kindParsed.error };
  }

  const categoriesParsed = parseCategoriesFromFormData(formData, kindParsed.kind);
  if (!categoriesParsed.ok) {
    return { error: categoriesParsed.error };
  }

  const urlParsed = parseOptionalPostUrl(
    String(formData.get("url") ?? ""),
    URL_MAX,
  );
  if (!urlParsed.ok) {
    return { error: urlParsed.error };
  }

  if (title.length < TITLE_MIN) {
    return { error: `Title must be at least ${TITLE_MIN} characters.` };
  }
  if (title.length > TITLE_MAX) {
    return { error: `Title must be at most ${TITLE_MAX} characters.` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return { error: `Description must be at most ${DESCRIPTION_MAX} characters.` };
  }

  const { supabase, userId } = auth;
  const urlCanonical = canonicalToolUrl(urlParsed.url);
  const { error } = await supabase
    .from("posts")
    .update({
      title,
      url: urlParsed.url,
      url_canonical: urlCanonical,
      description: description || null,
      post_kind: kindParsed.kind,
      categories: categoriesParsed.categories,
    })
    .eq("id", postId);

  if (error) return { error: "Could not update post." };
  await logAdminAction(userId, "update_post", "post", postId, { title });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/post/${postId}`);
  return {};
}

export async function adminUpdateComment(
  commentId: string,
  postId: string,
  content: string,
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;

  const text = normalizeUserText(content);
  if (text.length < 1) return { error: "Comment cannot be empty." };
  if (text.length > COMMENT_MAX) {
    return { error: `Comment must be at most ${COMMENT_MAX} characters.` };
  }

  const { supabase, userId } = auth;
  const { error } = await supabase
    .from("comments")
    .update({ content: text })
    .eq("id", commentId);

  if (error) return { error: "Could not update comment." };
  await logAdminAction(userId, "update_comment", "comment", commentId, { postId });
  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin");
  return {};
}
