import Link from "next/link";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { SignInWithGoogle } from "@/components/auth/sign-in-google";
import { safeRelativeNextPath } from "@/lib/safe-next-path";

export const metadata = {
  title: "Sign in · AICommunityLab",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const nextPath = safeRelativeNextPath(sp.next ?? "/");
  const configError = sp.error === "config";
  const confirmError = sp.error === "confirm";

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-zinc-100">Sign in</h1>
      {configError ? (
        <p
          className="mt-3 rounded-lg border border-amber-800/60 bg-amber-950/40 px-3 py-2 text-sm text-amber-200"
          role="alert"
        >
          Sign-in is unavailable: the app is missing Supabase configuration.
        </p>
      ) : null}
      {confirmError ? (
        <p
          className="mt-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200"
          role="alert"
        >
          Email link is invalid or expired. Request a new one from sign-up or
          password reset.
        </p>
      ) : null}
      <p className="mt-2 text-sm text-zinc-400">
        Continue with Google, or use email and password to create an account or
        sign in.
      </p>
      <div className="mt-8">
        <SignInWithGoogle nextPath={nextPath} />
      </div>
      <p className="my-6 text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
        Or email
      </p>
      <EmailAuthForm nextPath={nextPath} />
      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/" className="text-[#00ff9f] hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
