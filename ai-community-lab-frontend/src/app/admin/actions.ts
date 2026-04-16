"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserIsAdmin } from "@/lib/admin";
import { normalizeUserText } from "@/lib/normalize-user-text";
import { parseCategoriesFromFormData, parseOptionalPostUrl } from "@/lib/post-form";
import { safeHttpsImageUrl } from "@/lib/safe-remote-media-url";

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
): Promise<{ error?: string }> {
  if (!(await getCurrentUserIsAdmin())) return forbidden();
  if (status !== "published" && status !== "rejected" && status !== "pending") {
    return { error: "Invalid status." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ moderation_status: status })
    .eq("id", postId);
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
): Promise<{ error?: string }> {
  if (!(await getCurrentUserIsAdmin())) return forbidden();
  const supabase = await createClient();
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
  const imageRaw = normalizeUserText(String(formData.get("image_url") ?? ""));

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

  let image_url: string | null = null;
  if (imageRaw) {
    const safe = safeHttpsImageUrl(imageRaw);
    if (!safe) {
      return { error: "Image URL must be a valid https URL or empty." };
    }
    image_url = safe;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({
      title,
      url: urlParsed.url,
      description: description || null,
      categories: categoriesParsed.categories,
      image_url,
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
