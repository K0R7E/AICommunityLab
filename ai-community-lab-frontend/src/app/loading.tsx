export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-xl border border-zinc-800/80 bg-[#1a1a1a] p-4"
        >
          <div className="h-16 w-12 animate-pulse rounded-lg bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-800/80" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
