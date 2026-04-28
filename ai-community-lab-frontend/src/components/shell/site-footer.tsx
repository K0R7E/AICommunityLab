export function SiteFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-800/90 bg-background/95 backdrop-blur-md">
      <div className="mx-auto max-w-[1400px] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 text-center text-xs text-zinc-500 sm:px-6 sm:text-sm">
        <p>© {new Date().getFullYear()} AICommunityLab</p>
      </div>
    </footer>
  );
}
