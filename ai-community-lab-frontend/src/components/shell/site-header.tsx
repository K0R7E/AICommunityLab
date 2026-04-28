import Link from "next/link";
import { PlusCircle, Sparkles } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationsInboxLink } from "@/components/shell/notifications-inbox-link";
import { ThemeToggle } from "@/components/shell/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/90 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-semibold tracking-tight text-zinc-100"
        >
          <Sparkles className="size-5 text-accent" aria-hidden />
          <span className="truncate">AICommunityLab</span>
        </Link>
        <div className="flex items-center justify-end gap-2">
          <Link
            href="/submit"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20 hover:border-accent/60"
          >
            <PlusCircle className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Submit Tool</span>
            <span className="sm:hidden">Submit</span>
          </Link>
          <NotificationsInboxLink />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
