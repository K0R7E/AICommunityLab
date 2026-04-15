"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function FeedSearch() {
  const router = useRouter();
  const sp = useSearchParams();
  const qParam = sp.get("q") ?? "";
  const [value, setValue] = useState(qParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    setValue(qParam);
  }, [qParam]);

  useEffect(() => {
    if (value === qParam) return;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const p = new URLSearchParams(sp.toString());
      const t = value.trim();
      if (t) p.set("q", t);
      else p.delete("q");
      const qs = p.toString();
      router.replace(qs ? `/?${qs}` : "/");
    }, 380);
    return () => window.clearTimeout(debounceRef.current);
  }, [value, qParam, router, sp]);

  const clearHref = (() => {
    const p = new URLSearchParams(sp.toString());
    p.delete("q");
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  })();

  return (
    <div className="relative mb-6">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tools, comments, categories…"
        autoComplete="off"
        className="w-full rounded-xl border border-zinc-800 bg-[#141414] py-2.5 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-[#00ff9f]/40 focus:ring-2 focus:ring-[#00ff9f]/15"
        aria-label="Search feed"
      />
      {value ? (
        <Link
          href={clearHref}
          className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
