import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Shown at the top of /terms and /privacy when the visitor is signed in but
 * has not yet accepted the terms (i.e. they are mid-registration and opened
 * one of these pages in a new tab from the consent gate).
 *
 * Returns null for anonymous visitors and for users who already accepted.
 */
export async function RegistrationBanner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_accepted_terms")
    .eq("id", user.id)
    .maybeSingle<{ has_accepted_terms?: boolean | null }>();

  if (profile?.has_accepted_terms === true) return null;

  return (
    <div className="sticky top-0 z-50 w-full border-b border-accent/30 bg-accent/10 px-4 py-3 backdrop-blur-sm">
      <p className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-200">
        <span>
          You&apos;re almost registered! After reading, return to the previous
          tab to accept and continue.
        </span>
        <Link
          href="/welcome"
          className="shrink-0 rounded-md border border-accent/50 bg-accent/20 px-3 py-1 text-xs font-semibold text-accent transition hover:bg-accent/30"
        >
          ← Back to registration
        </Link>
      </p>
    </div>
  );
}
