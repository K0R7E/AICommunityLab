"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";
import { isValidUsername, normalizeUsername } from "@/lib/validate-profile";

const TITLE_MIN = 3;

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
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

  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  if (title.length < TITLE_MIN) {
    return { error: `Title must be at least ${TITLE_MIN} characters.` };
  }
  if (!isValidUrl(url)) {
    return { error: "Please enter a valid http(s) URL." };
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return { error: "Invalid category." };
  }

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    title,
    url,
    description: description || null,
    category,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}

export async function addComment(postId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in to comment." };
  }

  const text = content.trim();
  if (text.length < 1) {
    return { error: "Comment cannot be empty." };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    content: text,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/post/${postId}`);
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
  const bio = String(formData.get("bio") ?? "").trim();
  const websiteRaw = String(formData.get("website") ?? "").trim();

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
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already taken." };
    }
    return { error: error.message };
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
