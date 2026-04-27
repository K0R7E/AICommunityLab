type TrendingLevel = "rising" | "trending" | "fire";

function isWithin24h(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;
}

export function getTrendingLevel(
  rank: number,
  createdAt: string,
): TrendingLevel | null {
  if (rank <= 0 || rank > 30) return null;
  if (rank <= 3 && isWithin24h(createdAt)) return "fire";
  if (rank <= 10) return "trending";
  return "rising";
}

function BarBars() {
  return (
    <span className="trending-bars" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="trending-bar"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

type Props = {
  level: TrendingLevel;
  rank: number;
};

export function TrendingBadge({ level, rank }: Props) {
  if (level === "fire") {
    return (
      <span className="trending-fire" aria-label={`On fire — ranked #${rank}`}>
        <span className="flame-glyph" aria-hidden />
        ON FIRE
        <span className="rank-tick" aria-hidden>#{rank}</span>
      </span>
    );
  }

  if (level === "trending") {
    return (
      <span className="trending-hot" aria-label="Trending">
        <BarBars />
        TRENDING
      </span>
    );
  }

  return (
    <span className="trending-rising" aria-label="Rising">
      <span className="rising-dot" aria-hidden />
      RISING
    </span>
  );
}
