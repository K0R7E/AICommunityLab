"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function pathWithQuery(basePath: string, params: URLSearchParams): string {
  const qs = params.toString();
  const base =
    basePath.length > 1 && basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  if (!qs) return base === "" ? "/" : base;
  if (base === "/" || base === "") return `/?${qs}`;
  return `${base}?${qs}`;
}

type Props = {
  /** URL path for reads/writes of the `q` param (e.g. `/` or `/admin`). */
  basePath?: string;
  /** Keep the bar visible while scrolling (feed home). */
  sticky?: string | boolean;
  placeholder?: string;
  "aria-label"?: string;
};

export function FeedSearch({
  basePath = "/",
  sticky = false,
  placeholder = "Search tools, comments, categories…",
  "aria-label": ariaLabel = "Search feed",
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const spKey = useMemo(() => sp.toString(), [sp]);
  const qParam = sp.get("q") ?? "";
  const [value, setValue] = useState(qParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setValue(qParam);
  }, [qParam]);

  useEffect(() => {
    if (value === qParam) return;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const p = new URLSearchParams(spKey);
      const t = value.trim();
      if (t) p.set("q", t);
      else p.delete("q");
      p.delete("cursor");
      router.replace(pathWithQuery(basePath, p));
    }, 380);
    return () => window.clearTimeout(debounceRef.current);
  }, [value, qParam, router, spKey, basePath]);

  const clearParams = new URLSearchParams(spKey);
  clearParams.delete("q");
  clearParams.delete("cursor");
  const clearHref = pathWithQuery(basePath, clearParams);

  const stickyClass =
    sticky === true || sticky === ""
      ? "sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-[25] -mx-4 border-b border-zinc-800/70 bg-[#0f0f0f]/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6"
      : typeof sticky === "string"
        ? sticky
        : "";

  return (
    <div className={stickyClass ? `${stickyClass} mb-6` : "relative mb-6"}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="min-h-11 w-full rounded-xl border border-zinc-800 bg-[#141414] py-2.5 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-[#00ff9f]/40 focus:ring-2 focus:ring-[#00ff9f]/15"
          aria-label={ariaLabel}
        />
        {value ? (
          <Link
            href={clearHref}
            className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
