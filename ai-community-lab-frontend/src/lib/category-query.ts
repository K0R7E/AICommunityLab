import { CATEGORIES, isListingKind, type ListingKind } from "@/lib/constants";

function normalizeCategoryLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of labels) {
    const t = s?.trim();
    if (!t) continue;
    if (!CATEGORIES.includes(t as (typeof CATEGORIES)[number])) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Validated labels from Next `searchParams` (`category` may repeat). */
export function categoryFilterFromSearchParams(sp: {
  category?: string | string[] | undefined;
}): string[] {
  const raw =
    sp.category === undefined ? [] : Array.isArray(sp.category) ? sp.category : [sp.category];
  return normalizeCategoryLabels(raw);
}

/** Same rules for client-side `URLSearchParams` (multiple `category=` keys). */
export function categoryFilterFromUrlSearchParams(sp: URLSearchParams): string[] {
  return normalizeCategoryLabels(sp.getAll("category"));
}

export function listingKindFromSearchParams(sp: {
  kind?: string | undefined;
}): ListingKind | null {
  const raw = sp.kind?.trim();
  if (!raw) return null;
  return isListingKind(raw) ? raw : null;
}

export function listingKindFromUrlSearchParams(sp: URLSearchParams): ListingKind | null {
  const raw = sp.get("kind")?.trim();
  if (!raw) return null;
  return isListingKind(raw) ? raw : null;
}
