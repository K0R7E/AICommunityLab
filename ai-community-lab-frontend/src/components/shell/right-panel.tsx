import Link from "next/link";
import { Suspense } from "react";
import { Newspaper } from "lucide-react";
import { getAiNewsPreview } from "@/lib/data/ai-news";

async function AiNewsSection() {
  const dataset = await getAiNewsPreview(6);
  if (dataset.articles.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Newspaper className="size-4 text-cyan-400" aria-hidden />
          AI News
        </h2>
        <Link
          href="/news"
          className="inline-flex min-h-8 items-center rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-cyan-400 transition hover:bg-zinc-800/80"
        >
          All news
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {dataset.articles.map((article) => (
          <article
            key={article.id}
            className="rounded-lg border border-zinc-800 bg-surface-sunken p-3 transition hover:border-zinc-700"
          >
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-semibold text-zinc-100 transition hover:text-cyan-400"
            >
              {article.title}
            </a>
            {article.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{article.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-zinc-500">
              {article.source} · {new Date(article.publishedAt).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export async function RightPanel() {
  return (
    <aside className="flex flex-col gap-8">
      <Suspense fallback={null}>
        <AiNewsSection />
      </Suspense>
    </aside>
  );
}
