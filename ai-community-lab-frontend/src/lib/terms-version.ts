/**
 * Bumping this string forces every signed-in user back through the consent
 * gate (`/welcome`) on their next navigation. Use ISO date format so the
 * version is also human-readable (e.g. for audit logs).
 *
 * Update this when the Privacy Policy or Terms of Use change in a way that
 * requires renewed consent.
 */
export const CURRENT_TERMS_VERSION = "2026-04-28";
