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
        <div className="flex max-w-[min(100%,20rem)] items-center justify-end gap-2">
          <Link
            href="/submit"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-zinc-700 bg-card px-2.5 py-2 text-xs font-medium text-zinc-200 transition hover:border-accent/45 lg:hidden"
          >
            <PlusCircle className="size-4 shrink-0 text-accent" aria-hidden />
            Submit
          </Link>
          <NotificationsInboxLink />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
