import Link from "next/link";
import { Plus } from "lucide-react";

export function SubmitFab() {
  return (
    <Link
      href="/submit"
      className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-2 rounded-full bg-[#00ff9f] px-5 text-sm font-semibold text-[#0f0f0f] shadow-lg shadow-[#00ff9f]/20 transition hover:bg-[#33ffa8] hover:shadow-[#00ff9f]/30"
      aria-label="Submit tool"
    >
      <Plus className="size-5" aria-hidden />
      <span className="hidden sm:inline">Submit Tool</span>
    </Link>
  );
}
