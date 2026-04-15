import Link from "next/link";
import { Suspense } from "react";
import { Home, Flame, Clock } from "lucide-react";
import { CategorySearch } from "@/components/shell/category-search";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/?sort=top", label: "Trending", icon: Flame },
  { href: "/?sort=new", label: "New", icon: Clock },
] as const;

export function Sidebar() {
  return (
    <aside className="flex flex-col gap-6">
      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href + label}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800/80 hover:text-[#00ff9f]"
          >
            <Icon className="size-4 shrink-0 text-zinc-500" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <Suspense
        fallback={
          <div className="px-3 py-2 text-xs text-zinc-500">Loading categories…</div>
        }
      >
        <CategorySearch />
      </Suspense>
    </aside>
  );
}
