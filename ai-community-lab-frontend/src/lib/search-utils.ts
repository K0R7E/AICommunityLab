/** Escape `%`, `_`, `\` for PostgreSQL LIKE / ILIKE patterns. */
export function escapeLikePattern(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
