export default function NewsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-80 animate-pulse rounded bg-zinc-800/70" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800/80 bg-[#1a1a1a] p-4"
        >
          <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-800/70" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-zinc-800/60" />
        </div>
      ))}
    </div>
  );
}
