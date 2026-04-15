"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/constants";

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
