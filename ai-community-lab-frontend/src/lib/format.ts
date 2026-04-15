export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatRatingDisplay(
  ratingSum: number,
  ratingCount: number,
): { avg: string; countLabel: string } {
  if (ratingCount <= 0) {
    return { avg: "—", countLabel: "no ratings" };
  }
  const avg = (ratingSum / ratingCount).toFixed(1);
  return {
    avg,
    countLabel:
      ratingCount === 1 ? "1 rating" : `${ratingCount} ratings`,
  };
}
