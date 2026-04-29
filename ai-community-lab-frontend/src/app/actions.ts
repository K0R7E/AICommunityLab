"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canonicalToolUrl } from "@/lib/canonical-tool-url";
import {
  loadSimilarPostsForSubmit,
  maxSimilarityScore,
  SIMILARITY_BLOCK_THRESHOLD,
  type SimilarCandidate,
} from "@/lib/duplicate-post-check";
import { normalizeUserText } from "@/lib/normalize-user-text";
import {
  parseCategoriesFromFormData,
  parseListingKindFromFormData,
  parseOptionalPostUrl,
} from "@/lib/post-form";
import { safeRelativeNextPath } from "@/lib/safe-next-path";
import { CURRENT_TERMS_VERSION } from "@/lib/terms-version";
import { isValidUsername, normalizeUsername } from "@/lib/validate-profile";
import type { ListingKind } from "@/lib/constants";
import { logUserActivity } from "@/lib/user-activity-logger";

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const URL_MAX = 2048;
const DESCRIPTION_MAX = 10_000;
const COMMENT_MAX = 8000;
const BIO_MAX = 2000;
const URL_PATTERN = /https?:\/\/\S+|www\.\S+\.\S+/i;

function genericActionError(): string {
  return "Something went wrong. Please try again.";
}

export type SubmitFieldSnapshot = {
  title: string;
  description: string;
  url: string;
  listingKind: ListingKind;
  category: string;
};

export type SubmitPostState = {
  error: string | null;
  duplicateUrlPostId?: string;
  duplicateWarning?: {
    candidates: SimilarCandidate[];
    fieldSnap: SubmitFieldSnapshot;
  };
};

export async function submitPost(
  _prev: SubmitPostState,
  formData: FormData,
): Promise<SubmitPostState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to submit a tool." };
  }

  const title = normalizeUserText(String(formData.get("title") ?? ""));
  const description = normalizeUserText(String(formData.get("description") ?? ""));
  const confirmDuplicate = formData.get("confirm_duplicate") === "on";

  const kindParsed = parseListingKindFromFormData(formData);
  if (!kindParsed.ok) {
    return { error: kindParsed.error };
  }

  const categoriesParsed = parseCategoriesFromFormData(formData, kindParsed.kind);
  if (!categoriesParsed.ok) {
    return { error: categoriesParsed.error };
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
  if (URL_PATTERN.test(title) || URL_PATTERN.test(description)) {
    return { error: "Links are not allowed in tool submissions." };
  }

  const fieldSnap: SubmitFieldSnapshot = {
    title,
    description,
    url: "",
    listingKind: kindParsed.kind,
    category: categoriesParsed.categories[0] ?? "",
  };

  const candidates = await loadSimilarPostsForSubmit(supabase, title, description || null);
  const maxScore = maxSimilarityScore(candidates);
  if (maxScore >= SIMILARITY_BLOCK_THRESHOLD && !confirmDuplicate) {
    return { error: null, duplicateWarning: { candidates, fieldSnap } };
  }

  const { data: inserted, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      title,
      url: null,
      url_canonical: null,
      description: description || null,
      post_kind: kindParsed.kind,
      categories: categoriesParsed.categories,
    })
    .select("id")
    .single();

  if (error) {
    return { error: genericActionError() };
  }

  const newId = (inserted as { id: string }).id;
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/post/${newId}`);
  redirect(`/post/${newId}?submitted=1`);
}

export async function updateOwnPost(
  postId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to edit your tool." };
  }

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

  if (title.length < TITLE_MIN) {
    return { error: `Title must be at least ${TITLE_MIN} characters.` };
  }
  if (title.length > TITLE_MAX) {
    return { error: `Title must be at most ${TITLE_MAX} characters.` };
  }
  if (description.length > DESCRIPTION_MAX) {
    return { error: `Description must be at most ${DESCRIPTION_MAX} characters.` };
  }
  if (URL_PATTERN.test(title) || URL_PATTERN.test(description)) {
    return { error: "Links are not allowed in tool submissions." };
  }

  const { data: updated, error } = await supabase
    .from("posts")
    .update({
      title,
      description: description || null,
      post_kind: kindParsed.kind,
      categories: categoriesParsed.categories,
    })
    .eq("id", postId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "42501" || error.message?.toLowerCase().includes("policy")) {
      return { error: "You can only edit your own tool." };
    }
    return { error: genericActionError() };
  }

  if (!updated) {
    return { error: "Tool not found or you are not allowed to edit it." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin");
  return {};
}

export async function deleteOwnPost(postId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to delete your tool." };
  }

  const { data: deleted, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "42501" || error.message?.toLowerCase().includes("policy")) {
      return { error: "You can only delete your own tool." };
    }
    return { error: genericActionError() };
  }

  if (!deleted) {
    return { error: "Tool not found or you are not allowed to delete it." };
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin");
  return {};
}

export async function addComment(postId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to comment." };
  }

  const text = normalizeUserText(content);
  if (text.length < 1) {
    return { error: "Comment cannot be empty." };
  }
  if (text.length > COMMENT_MAX) {
    return { error: `Comment must be at most ${COMMENT_MAX} characters.` };
  }
  if (URL_PATTERN.test(text)) {
    return { error: "Links are not allowed in comments." };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    content: text,
  });

  if (error) {
    if (error.code === "42501" || error.message?.toLowerCase().includes("policy")) {
      return {
        error:
          "Comments are only open after this tool is approved on the public feed.",
      };
    }
    return { error: genericActionError() };
  }

  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin");
  return { success: true };
}

export type UpdateProfileState = {
  error: string | null;
  /** Set when save succeeded; new timestamp on each success for client effects */
  doneAt?: number;
};

export async function updateProfile(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to update your profile." };
  }

  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentEvents } = await admin
    .from("user_activity_log")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("event_type", "profile_updated")
    .gte("created_at", windowStart)
    .order("created_at", { ascending: true })
    .limit(5);
  if ((recentEvents?.length ?? 0) >= 5) {
    const oldestTs = recentEvents![0].created_at as string;
    const retryAt = new Date(new Date(oldestTs).getTime() + 60 * 60 * 1000);
    const minutesLeft = Math.max(1, Math.ceil((retryAt.getTime() - Date.now()) / 60_000));
    return {
      error: `Profile update limit reached (5 per hour). You can update again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
    };
  }

  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const bio = normalizeUserText(String(formData.get("bio") ?? ""));

  if (bio.length > BIO_MAX) {
    return { error: `Bio must be at most ${BIO_MAX} characters.` };
  }

  if (!isValidUsername(username)) {
    return {
      error:
        "Username must be 3–32 characters: lowercase letters, numbers, and underscores.",
    };
  }

  const notifyNewTools = formData.get("notify_new_tools") === "on";
  const notifyCommentsOnTools = formData.get("notify_comments_on_tools") === "on";
  const notifyModerationUpdates = formData.get("notify_moderation_updates") === "on";

  const { data: before } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      bio: bio || null,
      notify_new_tools: notifyNewTools,
      notify_comments_on_tools: notifyCommentsOnTools,
      notify_moderation_updates: notifyModerationUpdates,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: genericActionError() };
  }

  void logUserActivity(user.id, "profile_updated", { username });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  const prevName = before?.username as string | undefined;
  if (prevName && prevName !== username) {
    revalidatePath(`/profile/${prevName}`);
  }
  revalidatePath(`/profile/${username}`);

  return { error: null, doneAt: Date.now() };
}

/**
 * First-login consent gate. Records that the signed-in user has accepted the
 * current Privacy Policy + Terms of Use, then redirects them to the original
 * destination. Throws (via `redirect`) on success — never returns normally.
 *
 * The `next` parameter is sanitised against the same allowlist used for OAuth
 * post-login redirects to prevent open-redirect abuse.
 */
export async function acceptTerms(
  next: string,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to continue." };
  }

  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      has_accepted_terms: true,
      accepted_terms_at: now,
      accepted_terms_version: CURRENT_TERMS_VERSION,
    })
    .eq("id", user.id)
    .select("id");

  if (error) {
    return { error: genericActionError() };
  }

  // If 0 rows were updated the profile row doesn't exist yet (the
  // handle_new_user trigger failed silently on signup). Create it now so
  // consent is recorded and the gate doesn't loop forever.
  if (!updated?.length) {
    const fallback = `user_${user.id.replace(/-/g, "").slice(0, 8)}`;
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username: fallback,
      has_accepted_terms: true,
      accepted_terms_at: now,
      accepted_terms_version: CURRENT_TERMS_VERSION,
    });
    if (insertError) {
      return { error: genericActionError() };
    }
  }

  // `revalidatePath('/', 'layout')` invalidates the root layout — including
  // the cached profile summary used by the consent gate — so the next render
  // sees has_accepted_terms = true and the gate disappears.
  void logUserActivity(user.id, "terms_accepted", {
    version: CURRENT_TERMS_VERSION,
  });

  revalidatePath("/", "layout");

  const safeNext = safeRelativeNextPath(next);
  // Never bounce back through the consent gate itself.
  redirect(safeNext === "/welcome" ? "/" : safeNext);
}

export async function deleteAccount(): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to delete your account." };
  }

  const admin = createAdminClient();
  await logUserActivity(user.id, "account_deleted");
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { error: genericActionError() };
  }

  await supabase.auth.signOut();
  redirect("/");
}

