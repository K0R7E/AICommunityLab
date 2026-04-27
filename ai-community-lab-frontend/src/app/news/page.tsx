import type { Metadata } from "next";
import { getAiNewsDataset } from "@/lib/data/ai-news";

export const metadata: Metadata = {
  title: "AI News",
  description: "Latest artificial intelligence news from around the web.",
};

export default async function NewsPage() {
  const dataset = await getAiNewsDataset();
  const articles = dataset.articles;

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">AI News</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Aggregated from GNews search with a broad AI query, refreshed every 2 hours.
        </p>
      </div>

      {dataset.hasNewArticles ? (
        <div className="rounded-xl border border-[#00ff9f]/30 bg-[#00ff9f]/5 px-4 py-3 text-sm text-[#9fffd8]">
          New articles were found in the latest refresh.
        </div>
      ) : null}

      {dataset.sourceState === "stale" ? (
        <div className="rounded-xl border border-zinc-700 bg-[#1a1a1a] px-4 py-3 text-sm text-zinc-400">
          Live refresh failed, showing the most recently cached news.
        </div>
      ) : null}

      {dataset.sourceState === "error" ? (
        <div className="rounded-xl border border-zinc-700 bg-[#1a1a1a] px-4 py-8 text-center text-zinc-400">
          AI news is currently unavailable. Please try again later.
        </div>
      ) : null}

      {dataset.sourceState === "empty" && articles.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-6 py-10 text-center text-zinc-400">
          No AI news articles are available right now.
        </div>
      ) : null}

      {articles.length > 0 ? (
        <div className="flex flex-col gap-4">
          {articles.map((article) => (
            <article
              key={article.id}
              className="rounded-xl border border-zinc-800/80 bg-[#1a1a1a] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-base font-semibold text-zinc-100 transition hover:text-[#00ff9f]"
                  >
                    {article.title}
                  </a>
                  <p className="mt-1 text-xs text-zinc-500">
                    {article.source} · {new Date(article.publishedAt).toLocaleString()}
                  </p>
                </div>
                {article.isNew ? (
                  <span className="rounded-full border border-[#00ff9f]/40 bg-[#00ff9f]/10 px-2 py-0.5 text-xs font-medium text-[#00ff9f]">
                    New
                  </span>
                ) : null}
              </div>
              {article.description ? (
                <p className="mt-2 text-sm text-zinc-400">{article.description}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
