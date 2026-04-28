import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-800/90 bg-background">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 text-center text-xs text-zinc-500 sm:px-6">
        <span>© {new Date().getFullYear()} AICommunityLab</span>
        <Link href="/privacy" className="hover:text-[#00ff9f] hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-[#00ff9f] hover:underline">
          Terms of Use
        </Link>
      </div>
    </footer>
  );
}
