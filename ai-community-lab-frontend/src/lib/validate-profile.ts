const USERNAME_RE = /^[a-z0-9_]{3,32}$/;

export function isValidUsername(s: string): boolean {
  return USERNAME_RE.test(s.trim());
}

export function normalizeUsername(s: string): string {
  return s.trim().toLowerCase();
}
