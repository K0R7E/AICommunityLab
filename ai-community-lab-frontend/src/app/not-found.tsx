import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-6 py-12 text-center">
      <h1 className="text-xl font-semibold text-zinc-100">Not found</h1>
      <p className="mt-2 text-sm text-zinc-500">
        This post doesn’t exist or was removed.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-[#00ff9f] hover:underline"
      >
        Back to feed
      </Link>
    </div>
  );
}
