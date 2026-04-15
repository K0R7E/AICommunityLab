import Link from "next/link";
import { Home, Flame, Clock, FolderOpen, PlusCircle } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

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
      <div>
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Categories
        </p>
        <ul className="flex flex-col gap-1">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                href={`/?category=${encodeURIComponent(c)}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800/80 hover:text-[#00ff9f]"
              >
                <FolderOpen className="size-4 shrink-0 text-zinc-500" aria-hidden />
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href="/submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00ff9f] px-4 py-2.5 text-sm font-medium text-[#0f0f0f] transition hover:bg-[#33ffa8]"
      >
        <PlusCircle className="size-4" aria-hidden />
        Submit Tool
      </Link>
    </aside>
  );
}
