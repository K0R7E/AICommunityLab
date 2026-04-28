import Link from "next/link";
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
      <p className="mt-2 text-sm text-zinc-400">
        Continue with Google to sign in.
      </p>
      <div className="mt-8">
        <SignInWithGoogle nextPath={nextPath} />
      </div>
      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/" className="text-accent hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
