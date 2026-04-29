import Link from "next/link";
import { Suspense } from "react";
import { Newspaper } from "lucide-react";
import { getAiNewsPreview } from "@/lib/data/ai-news";
import { safeHttpExternalUrl } from "@/lib/safe-external-url";
import { createClient } from "@/lib/supabase/server";

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
        {dataset.articles.map((article) => {
          const safeUrl = safeHttpExternalUrl(article.url);
          return (
          <article
            key={article.id}
            className="rounded-lg border border-zinc-800 bg-surface-sunken p-3 transition hover:border-zinc-700"
          >
            {safeUrl ? (
            <a
              href={safeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-semibold text-zinc-100 transition hover:text-cyan-400"
            >
              {article.title}
            </a>
            ) : (
            <span className="text-sm font-semibold text-zinc-100">{article.title}</span>
            )}
            {article.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{article.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-zinc-500">
              {article.source} · {new Date(article.publishedAt).toLocaleString()}
            </p>
          </article>
          );
        })}
      </div>
    </section>
  );
}

export async function RightPanel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <aside className="flex flex-col gap-8">
      {user ? (
        <Suspense fallback={null}>
          <AiNewsSection />
        </Suspense>
      ) : (
        <div className="relative">
          <div className="pointer-events-none select-none blur-sm" aria-hidden>
            {/* Blurred placeholder to hint at AI News content */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  <span className="size-4 rounded bg-cyan-400/40" />
                  AI News
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {["80%", "60%", "90%", "70%", "55%"].map((w, i) => (
                  <div key={i} className="rounded-lg border border-zinc-800 bg-surface-sunken p-3">
                    <div className="h-4 rounded bg-zinc-700/60" style={{ width: w }} />
                    <div className="mt-1.5 h-3 w-full rounded bg-zinc-800/80" />
                    <div className="mt-1 h-3 w-3/4 rounded bg-zinc-800/80" />
                    <div className="mt-2 h-2.5 w-2/5 rounded bg-zinc-700/40" />
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/40 backdrop-blur-[2px]">
            <p className="text-center text-sm font-medium text-zinc-300">
              Sign in to read AI News
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-9 items-center rounded-md border border-accent/60 px-4 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
