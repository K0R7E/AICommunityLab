"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserIsAdmin } from "@/lib/admin";
import { canonicalToolUrl } from "@/lib/canonical-tool-url";
import { normalizeUserText } from "@/lib/normalize-user-text";
import { parseCategoriesFromFormData, parseOptionalPostUrl } from "@/lib/post-form";

function forbidden(): { error: string } {
  return { error: "Not allowed." };
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
  if (!(await getCurrentUserIsAdmin())) return forbidden();
  if (status !== "published" && status !== "rejected" && status !== "pending") {
    return { error: "Invalid status." };
  }
  const supabase = await createClient();
  const trimmed = rejectionReason?.trim() || null;
  const patch =
    status === "rejected"
      ? { moderation_status: status, moderation_rejection_reason: trimmed }
      : { moderation_status: status, moderation_rejection_reason: null };
  const { error } = await supabase.from("posts").update(patch).eq("id", postId);
  if (error) return { error: "Could not update moderation status." };
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/post/${postId}`);
  return {};
}

export async function adminDeletePost(postId: string): Promise<{ error?: string }> {
  if (!(await getCurrentUserIsAdmin())) return forbidden();
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: "Could not delete post." };
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
  if (!(await getCurrentUserIsAdmin())) return forbidden();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: row } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .maybeSingle();

  const authorId = (row as { user_id?: string } | null)?.user_id;
  if (authorId && user && authorId !== user.id) {
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "moderation_push_notification",
      {
        p_user_id: authorId,
        p_type: "comment_removed",
        p_post_id: postId,
        p_message: moderatorNote?.trim() || null,
      },
    );
    if (rpcError) {
      return {
        error:
          "Could not notify the comment author. Apply migration 021_notification_preferences_and_rpc_hardening.sql or try again.",
      };
    }
    if (rpcResult !== "inserted" && rpcResult !== "skipped") {
      return {
        error:
          "Could not notify the comment author due to an unexpected moderation RPC result.",
      };
    }
  }

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: "Could not delete comment." };
  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin");
  return {};
}

export async function adminUpdatePost(
  postId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await getCurrentUserIsAdmin())) return forbidden();

  const title = normalizeUserText(String(formData.get("title") ?? ""));
  const description = normalizeUserText(String(formData.get("description") ?? ""));

  const categoriesParsed = parseCategoriesFromFormData(formData);
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

  const supabase = await createClient();
  const urlCanonical = canonicalToolUrl(urlParsed.url);
  const { error } = await supabase
    .from("posts")
    .update({
      title,
      url: urlParsed.url,
      url_canonical: urlCanonical,
      description: description || null,
      categories: categoriesParsed.categories,
    })
    .eq("id", postId);

  if (error) return { error: "Could not update post." };
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
  if (!(await getCurrentUserIsAdmin())) return forbidden();

  const text = normalizeUserText(content);
  if (text.length < 1) return { error: "Comment cannot be empty." };
  if (text.length > COMMENT_MAX) {
    return { error: `Comment must be at most ${COMMENT_MAX} characters.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .update({ content: text })
    .eq("id", commentId);

  if (error) return { error: "Could not update comment." };
  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin");
  return {};
}
