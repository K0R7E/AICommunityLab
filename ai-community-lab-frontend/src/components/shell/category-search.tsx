"use client";

import Link from "next/link";
import { FolderOpen, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/constants";

function categoryHref(category: string, sp: URLSearchParams) {
  const p = new URLSearchParams(sp.toString());
  p.set("category", category);
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

export function CategorySearch() {
  const sp = useSearchParams();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const t = filter.trim().toLowerCase();
    if (!t) return [...CATEGORIES];
    return CATEGORIES.filter((c) => c.toLowerCase().includes(t));
  }, [filter]);

  return (
    <div>
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Categories
      </p>
      <div className="relative mb-2 px-3">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          autoComplete="off"
          className="w-full rounded-lg border border-zinc-800 bg-[#141414] py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none ring-[#00ff9f]/0 transition focus:border-[#00ff9f]/40 focus:ring-2 focus:ring-[#00ff9f]/15"
          aria-label="Filter categories"
        />
      </div>
      <ul className="flex max-h-[min(40vh,20rem)] flex-col gap-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-zinc-500">No matching category.</li>
        ) : (
          filtered.map((c) => (
            <li key={c}>
              <Link
                href={categoryHref(c, new URLSearchParams(sp.toString()))}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800/80 hover:text-[#00ff9f]"
              >
                <FolderOpen className="size-4 shrink-0 text-zinc-500" aria-hidden />
                {c}
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
