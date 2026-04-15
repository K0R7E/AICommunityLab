export const CATEGORIES = [
  "AI Tools",
  "Automation",
  "Marketing",
  "Coding",
] as const;

export type Category = (typeof CATEGORIES)[number];
