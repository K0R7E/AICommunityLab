"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { categoryFilterFromUrlSearchParams, listingKindFromUrlSearchParams } from "@/lib/category-query";

export function FeedSortBar() {
  const sp = useSearchParams();
  const sort = sp.get("sort") === "top" ? "top" : "new";
  const categories = categoryFilterFromUrlSearchParams(sp);
  const listingKind = listingKindFromUrlSearchParams(sp);
  const q = sp.get("q");

  const newHref = (() => {
    const p = new URLSearchParams();
    p.set("sort", "new");
    for (const c of categories) p.append("category", c);
    if (listingKind) p.set("kind", listingKind);
    if (q) p.set("q", q);
    return `/?${p.toString()}`;
  })();
  const topHref = (() => {
    const p = new URLSearchParams();
    p.set("sort", "top");
    for (const c of categories) p.append("category", c);
    if (listingKind) p.set("kind", listingKind);
    if (q) p.set("q", q);
    return `/?${p.toString()}`;
  })();

  const clearCategoryHref = (() => {
    const p = new URLSearchParams();
    if (sort === "top") p.set("sort", "top");
    if (listingKind) p.set("kind", listingKind);
    if (q) p.set("q", q);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
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
      {categories.length > 0 ? (
        <Link
          href={clearCategoryHref}
          className="text-sm text-[#00ff9f] underline-offset-2 hover:underline"
        >
          Clear categories
        </Link>
      ) : null}
    </div>
  );
}
