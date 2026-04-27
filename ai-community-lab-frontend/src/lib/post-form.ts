import {
  CATEGORIES_BY_KIND,
  isListingKind,
  type ListingKind,
} from "@/lib/constants";
import { normalizeUserText } from "@/lib/normalize-user-text";

export function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns null when empty; validates when non-empty. */
export function parseOptionalPostUrl(
  raw: string,
  maxLen: number,
): { ok: true; url: string | null } | { ok: false; error: string } {
  const url = normalizeUserText(raw);
  if (!url) return { ok: true, url: null };
  if (url.length > maxLen) {
    return { ok: false, error: "URL is too long." };
  }
  if (!isValidHttpUrl(url)) {
    return { ok: false, error: "Please enter a valid http(s) URL." };
  }
  return { ok: true, url };
}

/** One category on create/update; stored as a single-element `categories` array. */
export function parseCategoriesFromFormData(
  formData: FormData,
  kind: ListingKind,
): { ok: true; categories: string[] } | { ok: false; error: string } {
  const raw = normalizeUserText(String(formData.get("category") ?? ""));
  if (!raw) {
    return { ok: false, error: "Pick a category." };
  }
  const allowed = CATEGORIES_BY_KIND[kind];
  if (!allowed.includes(raw)) {
    return { ok: false, error: "Invalid category." };
  }
  return { ok: true, categories: [raw] };
}

export function parseListingKindFromFormData(
  formData: FormData,
): { ok: true; kind: ListingKind } | { ok: false; error: string } {
  const raw = normalizeUserText(String(formData.get("listing_kind") ?? ""));
  if (!raw) {
    return { ok: false, error: "Pick listing type." };
  }
  if (!isListingKind(raw)) {
    return { ok: false, error: "Invalid listing type." };
  }
  return { ok: true, kind: raw };
}
