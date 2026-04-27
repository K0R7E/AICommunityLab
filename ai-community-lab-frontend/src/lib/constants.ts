export const LISTING_KINDS = ["AI Engine", "AI Agent"] as const;
export type ListingKind = (typeof LISTING_KINDS)[number];

export const ENGINE_CATEGORIES = [
  "General LLM",
  "Reasoning Model",
  "Coding Model",
  "Image Generation Model",
  "Video Generation Model",
  "Speech / Audio Model",
  "Embedding Model",
  "Reranker Model",
  "Multimodal Model",
  "Open-Source Model",
] as const;

export const AGENT_CATEGORIES = [
  "Coding Agent",
  "Research Agent",
  "Writing Agent",
  "Data Analysis Agent",
  "Customer Support Agent",
  "Sales Agent",
  "Marketing Agent",
  "Automation Agent",
  "DevOps Agent",
  "Multi-Agent Platform",
] as const;

export const CATEGORIES_BY_KIND: Record<ListingKind, readonly string[]> = {
  "AI Engine": ENGINE_CATEGORIES,
  "AI Agent": AGENT_CATEGORIES,
};

export const CATEGORIES = [...ENGINE_CATEGORIES, ...AGENT_CATEGORIES] as const;
export type Category = (typeof CATEGORIES)[number];

export function isListingKind(value: string): value is ListingKind {
  return LISTING_KINDS.includes(value as ListingKind);
}

export function inferListingKindFromCategory(category: string): ListingKind {
  if (AGENT_CATEGORIES.includes(category as (typeof AGENT_CATEGORIES)[number])) {
    return "AI Agent";
  }
  return "AI Engine";
}
