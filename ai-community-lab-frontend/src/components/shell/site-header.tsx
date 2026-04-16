import Link from "next/link";
import { Sparkles } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationsInboxLink } from "@/components/shell/notifications-inbox-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/90 bg-[#0f0f0f]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-zinc-100"
        >
          <Sparkles className="size-5 text-[#00ff9f]" aria-hidden />
          <span>AICommunityLab</span>
        </Link>
        <div className="flex max-w-[min(100%,20rem)] items-center justify-end gap-2">
          <NotificationsInboxLink />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
