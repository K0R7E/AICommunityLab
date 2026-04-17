import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Similarity policy (no-URL path): compare only against pending + published (excludes
 * rejected) via RPC. Block first submit when best score >= threshold unless
 * confirm_duplicate is sent (checkbox).
 */
export const SIMILARITY_BLOCK_THRESHOLD = 0.33;

export type SimilarCandidate = {
  id: string;
  title: string;
  excerpt: string | null;
  moderation_status: string;
  score: number;
};

export async function loadSimilarPostsForSubmit(
  supabase: SupabaseClient,
  title: string,
  description: string | null,
): Promise<SimilarCandidate[]> {
  const { data, error } = await supabase.rpc("find_similar_posts_for_submit", {
    p_title: title,
    p_description: description ?? "",
    p_max_results: 12,
  });
  if (error || !Array.isArray(data)) return [];
  return data as SimilarCandidate[];
}

export function maxSimilarityScore(candidates: SimilarCandidate[]): number {
  if (candidates.length === 0) return 0;
  return Math.max(...candidates.map((c) => Number(c.score) || 0));
}
