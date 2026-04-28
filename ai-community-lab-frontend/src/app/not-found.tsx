import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-card px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-zinc-100">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-500">
        The page you’re looking for isn’t here — it may have been removed, or the
        link might be wrong. Try the feed or search from the home page.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
        <Link href="/" className="text-accent hover:underline">
          Back to feed
        </Link>
        <Link href="/login" className="text-zinc-400 hover:text-zinc-200 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
