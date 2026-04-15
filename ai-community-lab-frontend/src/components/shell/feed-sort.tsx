"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function FeedSortBar() {
  const sp = useSearchParams();
  const sort = sp.get("sort") === "top" ? "top" : "new";
  const category = sp.get("category");
  const q = sp.get("q");

  const newHref = (() => {
    const p = new URLSearchParams();
    p.set("sort", "new");
    if (category) p.set("category", category);
    if (q) p.set("q", q);
    return `/?${p.toString()}`;
  })();
  const topHref = (() => {
    const p = new URLSearchParams();
    p.set("sort", "top");
    if (category) p.set("category", category);
    if (q) p.set("q", q);
    return `/?${p.toString()}`;
  })();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-sm text-zinc-500">Sort</span>
      <div className="inline-flex rounded-lg border border-zinc-800 bg-[#141414] p-0.5">
        <Link
          href={newHref}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            sort === "new"
              ? "bg-zinc-800 text-[#00ff9f]"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          New
        </Link>
        <Link
          href={topHref}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            sort === "top"
              ? "bg-zinc-800 text-[#00ff9f]"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Top
        </Link>
      </div>
    </div>
  );
}
