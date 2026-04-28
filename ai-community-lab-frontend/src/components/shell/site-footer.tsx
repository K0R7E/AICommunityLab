import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/90 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 text-center text-xs text-zinc-500 sm:px-6">
        <span>© {new Date().getFullYear()} AICommunityLab</span>
        <Link href="/privacy" className="hover:text-[#00ff9f] hover:underline">
          Adatkezelési Tájékoztató
        </Link>
        <Link href="/terms" className="hover:text-[#00ff9f] hover:underline">
          ÁSZF
        </Link>
      </div>
    </footer>
  );
}
