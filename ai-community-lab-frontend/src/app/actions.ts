"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeUserText } from "@/lib/normalize-user-text";
import { parseCategoriesFromFormData, parseOptionalPostUrl } from "@/lib/post-form";
import { safeHttpsImageUrl } from "@/lib/safe-remote-media-url";
import { isValidUsername, normalizeUsername } from "@/lib/validate-profile";

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const URL_MAX = 2048;
const DESCRIPTION_MAX = 10_000;
const COMMENT_MAX = 8000;
const BIO_MAX = 2000;

function genericActionError(): string {
  return "Something went wrong. Please try again.";
}

export type SubmitPostState = { error: string | null };

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

  const imageRaw = normalizeUserText(String(formData.get("image_url") ?? ""));
  let image_url: string | null = null;
  if (imageRaw) {
    const safeImg = safeHttpsImageUrl(imageRaw);
    if (!safeImg) {
      return { error: "Image URL must be a valid https URL (e.g. CDN or static host)." };
    }
    image_url = safeImg;
  }

  const { data: inserted, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      title,
      url: urlParsed.url,
      description: description || null,
      categories: categoriesParsed.categories,
      image_url,
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

  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const bio = normalizeUserText(String(formData.get("bio") ?? ""));
  const websiteRaw = normalizeUserText(String(formData.get("website") ?? ""));

  if (bio.length > BIO_MAX) {
    return { error: `Bio must be at most ${BIO_MAX} characters.` };
  }

  if (!isValidUsername(username)) {
    return {
      error:
        "Username must be 3–32 characters: lowercase letters, numbers, and underscores.",
    };
  }

  let website: string | null = null;
  if (websiteRaw) {
    try {
      const u = new URL(
        websiteRaw.includes("://") ? websiteRaw : `https://${websiteRaw}`,
      );
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { error: "Website must be an http(s) URL." };
      }
      website = u.href;
    } catch {
      return { error: "Invalid website URL." };
    }
  }

  const notifyNewTools = formData.get("notify_new_tools") === "on";

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
      website,
      notify_new_tools: notifyNewTools,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: genericActionError() };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  const prevName = before?.username as string | undefined;
  if (prevName && prevName !== username) {
    revalidatePath(`/profile/${prevName}`);
  }
  revalidatePath(`/profile/${username}`);

  return { error: null, doneAt: Date.now() };
}
