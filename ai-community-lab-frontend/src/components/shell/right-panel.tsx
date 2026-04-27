import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { POST_MODERATION_PUBLISHED } from "@/lib/moderation";
import { SignInCard } from "@/components/auth/user-menu";
import { Newspaper, TrendingUp } from "lucide-react";
import { getAiNewsPreview } from "@/lib/data/ai-news";

async function getTrending() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, rating_avg, rating_count, leaderboard_score, bayes_score")
    .eq("moderation_status", POST_MODERATION_PUBLISHED)
    .order("leaderboard_score", { ascending: false, nullsFirst: false })
    .order("bayes_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

async function AiNewsSection() {
  const dataset = await getAiNewsPreview(3);
  if (dataset.articles.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          <Newspaper className="size-4 text-[#00ff9f]" aria-hidden />
          AI News
        </h2>
        <Link
          href="/news"
          className="inline-flex min-h-10 items-center rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-[#00ff9f] transition hover:bg-zinc-800/80"
        >
          Read News
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {dataset.articles.map((article) => (
          <article
            key={article.id}
            className="rounded-lg border border-zinc-800 bg-[#141414] p-3"
          >
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-semibold text-zinc-100 transition hover:text-[#00ff9f]"
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

type Props = {
  userEmail?: string | null;
};

export async function RightPanel({ userEmail }: Props) {
  const trending = await getTrending();

  return (
    <aside className="flex flex-col gap-8">
      <Suspense fallback={null}>
        <AiNewsSection />
      </Suspense>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <TrendingUp className="size-4 text-[#00ff9f]" aria-hidden />
          Trending tools
        </h2>
        <ol className="flex flex-col gap-2">
          {trending.length === 0 ? (
            <li className="text-sm text-zinc-500">Nothing trending yet.</li>
          ) : (
            trending.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/post/${p.id}`}
                  className="line-clamp-2 text-sm text-zinc-300 transition hover:text-[#00ff9f]"
                >
                  <span className="mr-2 font-mono text-xs text-zinc-600">
                    {i + 1}.
                  </span>
                  {p.title}
                  <span className="ml-2 text-xs text-zinc-500">
                    {p.rating_avg != null
                      ? `${Number(p.rating_avg).toFixed(1)} ★`
                      : "—"}{" "}
                    ({p.rating_count ?? 0})
                  </span>
                </Link>
              </li>
            ))
          )}
        </ol>
      </section>

      {!userEmail ? (
        <section className="rounded-xl border border-zinc-800 bg-[#1a1a1a] p-4">
          <h3 className="text-sm font-semibold text-zinc-100">Join the feed</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Sign in with Google to submit tools, vote, and comment.
          </p>
          <div className="mt-4">
            <SignInCard nextPath="/" />
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-[#00ff9f]/30 bg-[#141414] p-4">
        <h3 className="text-sm font-semibold text-[#00ff9f]">Share a tool</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Found something the community should know about?
        </p>
        <Link
          href="/submit"
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[#00ff9f]/60 bg-gradient-to-b from-[#00ff9f] to-[#00d986] px-4 py-2 text-sm font-semibold text-[#061a13] shadow-[0_0_0_1px_rgba(0,255,159,0.35),0_10px_28px_-10px_rgba(0,255,159,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition duration-[120ms] hover:-translate-y-px active:translate-y-0"
        >
          Submit a tool
        </Link>
      </section>
    </aside>
  );
}
