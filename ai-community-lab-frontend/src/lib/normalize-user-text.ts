/** Strip NULs and trim; safe for user-authored text before DB insert. */
export function normalizeUserText(s: string): string {
  return s.replace(/\u0000/g, "").trim();
}
