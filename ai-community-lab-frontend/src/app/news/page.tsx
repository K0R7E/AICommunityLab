import type { Metadata } from "next";
import { getAiNewsDataset } from "@/lib/data/ai-news";
import { safeHttpExternalUrl } from "@/lib/safe-external-url";

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
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">AI News</h1>
        <p className="mt-1 text-sm text-zinc-400">AI news, updated regularly.</p>
      </div>

      {dataset.hasNewArticles ? (
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-lime-300">
          New articles were found in the latest refresh.
        </div>
      ) : null}

      {dataset.sourceState === "stale" ? (
        <div className="rounded-xl border border-zinc-700 bg-card px-4 py-3 text-sm text-zinc-400">
          Live refresh failed, showing the most recently cached news.
        </div>
      ) : null}

      {dataset.sourceState === "error" ? (
        <div className="rounded-xl border border-zinc-700 bg-card px-4 py-8 text-center text-zinc-400">
          AI news is currently unavailable. Please try again later.
        </div>
      ) : null}

      {dataset.sourceState === "empty" && articles.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-card px-6 py-10 text-center text-zinc-400">
          No AI news articles are available right now.
        </div>
      ) : null}

      {articles.length > 0 ? (
        <div className="flex flex-col gap-4">
          {articles.map((article) => {
            const safeUrl = safeHttpExternalUrl(article.url);
            return (
            <article
              key={article.id}
              className="rounded-xl border border-zinc-800/80 bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {safeUrl ? (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-base font-semibold text-zinc-100 transition hover:text-accent"
                  >
                    {article.title}
                  </a>
                  ) : (
                  <span className="text-base font-semibold text-zinc-100">
                    {article.title}
                  </span>
                  )}
                  <p className="mt-1 text-xs text-zinc-500">
                    {article.source} · {new Date(article.publishedAt).toLocaleString()}
                  </p>
                </div>
                {article.isNew ? (
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    New
                  </span>
                ) : null}
              </div>
              {article.description ? (
                <p className="mt-2 text-sm text-zinc-400">{article.description}</p>
              ) : null}
            </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
