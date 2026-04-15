import Link from "next/link";
import { SignInWithGoogle } from "@/components/auth/sign-in-google";

export const metadata = {
  title: "Sign in · AICommunityLab",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const raw = sp.next?.trim() ?? "/";
  const nextPath = raw.startsWith("/") ? raw : "/";

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-zinc-100">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Use Google to join the community — submit tools, vote, and customize
        your profile.
      </p>
      <div className="mt-8">
        <SignInWithGoogle nextPath={nextPath} />
      </div>
      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/" className="text-[#00ff9f] hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}
