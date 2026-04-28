"use client";

import Link from "next/link";
import { FolderOpen, ListX, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CATEGORIES_BY_KIND, LISTING_KINDS, type ListingKind } from "@/lib/constants";
import {
  categoryFilterFromUrlSearchParams,
  listingKindFromUrlSearchParams,
} from "@/lib/category-query";

function toggleCategoryHref(label: string, sp: URLSearchParams): string {
  const p = new URLSearchParams(sp.toString());
  const active = categoryFilterFromUrlSearchParams(p);
  p.delete("category");
  p.delete("cursor");
  if (active.includes(label)) {
    for (const c of active) {
      if (c !== label) p.append("category", c);
    }
  } else {
    for (const c of active) p.append("category", c);
    p.append("category", label);
  }
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

function clearCategoriesHref(sp: URLSearchParams): string {
  const p = new URLSearchParams(sp.toString());
  p.delete("category");
  p.delete("cursor");
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

export function CategorySearch() {
  const sp = useSearchParams();
  const spKey = sp.toString();
  const listingKind = useMemo(
    () => listingKindFromUrlSearchParams(new URLSearchParams(spKey)),
    [spKey],
  );
  const active = useMemo(
    () => categoryFilterFromUrlSearchParams(new URLSearchParams(spKey)),
    [spKey],
  );
  const [filter, setFilter] = useState("");
  const effectiveKind: ListingKind = listingKind ?? "AI Engine";

  const filtered = useMemo(() => {
    const source = [...CATEGORIES_BY_KIND[effectiveKind]];
    const t = filter.trim().toLowerCase();
    if (!t) return source;
    return source.filter((c) => c.toLowerCase().includes(t));
  }, [effectiveKind, filter]);

  const kindHref = (kind: ListingKind): string => {
    const p = new URLSearchParams(sp.toString());
    p.set("kind", kind);
    p.delete("category");
    p.delete("cursor");
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div>
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Categories
      </p>
      <div className="mb-2 px-3">
        <div className="inline-flex w-full rounded-lg border border-zinc-800 bg-surface-sunken p-0.5">
          {LISTING_KINDS.map((kind) => (
            <Link
              key={kind}
              href={kindHref(kind)}
              className={`flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium transition ${
                effectiveKind === kind
                  ? "bg-zinc-800 text-accent"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {kind}
            </Link>
          ))}
        </div>
      </div>
      <p className="mb-2 px-3 text-xs text-zinc-600">
        Select several to show tools in any of them.
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
          className="w-full rounded-lg border border-zinc-800 bg-surface-sunken py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none ring-accent/0 transition focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
          aria-label="Filter categories"
        />
      </div>
      <ul className="flex max-h-[min(40vh,20rem)] flex-col gap-1 overflow-y-auto pr-1">
        {active.length > 0 ? (
          <li>
            <Link
              href={clearCategoriesHref(new URLSearchParams(sp.toString()))}
              className="flex items-center gap-3 rounded-lg border border-zinc-700/80 bg-zinc-900/50 px-3 py-2 text-sm font-medium text-accent transition hover:border-accent/35 hover:bg-zinc-800/80"
            >
              <ListX className="size-4 shrink-0" aria-hidden />
              Clear categories ({active.length})
            </Link>
          </li>
        ) : null}
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-zinc-500">No matching category.</li>
        ) : (
          filtered.map((c) => {
            const selected = active.includes(c);
            return (
              <li key={c}>
                <Link
                  href={toggleCategoryHref(c, new URLSearchParams(sp.toString()))}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    selected
                      ? "border border-accent/35 bg-accent/10 text-accent"
                      : "border border-transparent text-zinc-300 hover:bg-zinc-800/80 hover:text-accent"
                  }`}
                  aria-current={selected ? "true" : undefined}
                >
                  <FolderOpen className="size-4 shrink-0 text-zinc-500" aria-hidden />
                  {c}
                  {selected ? (
                    <span className="ml-auto text-xs font-normal text-zinc-400">
                      tap to remove
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
