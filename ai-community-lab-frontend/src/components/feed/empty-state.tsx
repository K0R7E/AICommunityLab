import Link from "next/link";

type PetriState = "empty" | "category" | "search";

function PetriDish({ state }: { state: PetriState }) {
  return (
    <div
      className="petri-dish relative mx-auto"
      style={{ width: 200, height: 200 }}
      role="img"
      aria-label="Lab petri dish illustration"
    >
      <div className="petri-crosshair" />
      {state === "empty" && (
        <>
          <div
            className="petri-organism"
            style={{ width: 80, height: 80, top: "28%", left: "22%" }}
          />
          <div
            className="petri-organism petri-cyan"
            style={{ width: 60, height: 60, top: "52%", left: "52%", animationDelay: "1.2s" }}
          />
          <div
            className="petri-organism"
            style={{ width: 28, height: 28, top: "18%", left: "62%", animationDelay: "2.4s" }}
          />
        </>
      )}
      {state === "category" && (
        <div
          className="petri-organism"
          style={{ width: 28, height: 28, top: "44%", left: "40%", opacity: 0.5 }}
        />
      )}
    </div>
  );
}

export function EmptyFeed() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-6 py-12">
      <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:gap-10 sm:text-left">
        <div className="shrink-0">
          <PetriDish state="empty" />
          <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Specimen-001 · Incubating
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">
            No tools yet — be the first
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            The lab is open. Submit an AI tool and kick off the feed.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#00ff9f]/60 bg-gradient-to-b from-[#00ff9f] to-[#00d986] px-5 py-2 text-sm font-semibold text-[#061a13] shadow-[0_0_0_1px_rgba(0,255,159,0.35),0_8px_20px_-8px_rgba(0,255,159,0.6),inset_0_1px_0_rgba(255,255,255,0.35)] transition duration-[120ms] hover:-translate-y-px active:translate-y-0"
            >
              Submit the first tool
            </Link>
            <Link
              href="/news"
              className="inline-flex min-h-10 items-center rounded-lg border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
            >
              Read AI News instead →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyCategory() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-6 py-12">
      <div className="flex flex-col items-center gap-6 text-center">
        <PetriDish state="category" />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            Sterile sample
          </p>
          <p className="mt-2 text-zinc-400">
            Nothing in this category yet — submit one or pick another.
          </p>
        </div>
      </div>
    </div>
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-6 py-12">
      <div className="flex flex-col items-center gap-6 text-center">
        <PetriDish state="search" />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            No matching cultures
          </p>
          <p className="mt-2 text-zinc-400">
            No results for{" "}
            <span className="font-mono text-zinc-300">&ldquo;{query}&rdquo;</span>.
            Try different words or clear the search.
          </p>
        </div>
      </div>
    </div>
  );
}
