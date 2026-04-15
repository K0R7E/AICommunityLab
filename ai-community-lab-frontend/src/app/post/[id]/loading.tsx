export default function PostLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4">
        <div className="h-20 w-14 rounded-lg bg-zinc-800" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-3/4 rounded bg-zinc-800" />
          <div className="h-4 w-1/2 rounded bg-zinc-800/80" />
          <div className="h-16 w-full rounded bg-zinc-800/60" />
        </div>
      </div>
      <div className="mt-12 space-y-3 border-t border-zinc-800 pt-8">
        <div className="h-6 w-32 rounded bg-zinc-800" />
        <div className="h-24 w-full rounded-lg bg-zinc-800/50" />
      </div>
    </div>
  );
}
