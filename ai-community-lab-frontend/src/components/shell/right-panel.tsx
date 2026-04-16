import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { POST_MODERATION_PUBLISHED } from "@/lib/moderation";
import { SignInCard } from "@/components/auth/user-menu";
import { TrendingUp } from "lucide-react";

async function getTrending() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, rating_avg, rating_count")
    .eq("moderation_status", POST_MODERATION_PUBLISHED)
    .order("rating_avg", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

type Props = {
  userEmail?: string | null;
};

export async function RightPanel({ userEmail }: Props) {
  const trending = await getTrending();

  return (
    <aside className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
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

      <section className="rounded-xl border border-dashed border-[#00ff9f]/30 bg-[#141414] p-4">
        <h3 className="text-sm font-semibold text-[#00ff9f]">Share a tool</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Found something the community should know about?
        </p>
        <Link
          href="/submit"
          className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#00ff9f] px-4 py-2 text-sm font-medium text-[#0f0f0f] transition hover:bg-[#33ffa8]"
        >
          Submit a tool
        </Link>
      </section>
    </aside>
  );
}
