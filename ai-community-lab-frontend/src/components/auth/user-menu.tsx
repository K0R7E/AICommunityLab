"use client";

import {
  Bell,
  ChevronDown,
  LogIn,
  LogOut,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { signOut } from "@/app/actions";
import { useAuth } from "./auth-provider";
import { safeRelativeNextPath } from "@/lib/safe-next-path";
import { SignInWithGoogle } from "./sign-in-google";
import { safeHttpsImageUrl } from "@/lib/safe-remote-media-url";

function initials(email: string | undefined, username: string | undefined) {
  if (username?.length) return username.slice(0, 2).toUpperCase();
  if (email?.length) return email.slice(0, 2).toUpperCase();
  return "?";
}

/**
 * Submit button for the sign-out form. Lives inside `<form action={signOut}>`
 * so React Server Actions wire up the `pending` state automatically — that's
 * what `useFormStatus()` reads, and it only works when used within a form.
 */
function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="menuitem"
      disabled={pending}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800/80 disabled:opacity-50"
    >
      <LogOut className="size-4 text-zinc-400" />
      {pending ? "Signing out…" : "Logout"}
    </button>
  );
}

export function UserMenu() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) {
    const next = safeRelativeNextPath(pathname.startsWith("/login") ? "/" : pathname);
    return (
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-card px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-accent/50"
      >
        <LogIn className="size-4 shrink-0" aria-hidden />
        Sign in
      </Link>
    );
  }

  const display = profile?.username ?? user.email ?? "Account";
  const avatarUrl = safeHttpsImageUrl(profile?.avatar_url);
  const profileHref = profile
    ? `/profile/${encodeURIComponent(profile.username)}`
    : "/settings";

  return (
    <div ref={wrapRef} className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-card py-1.5 pl-1.5 pr-2 text-sm text-zinc-200 transition hover:border-accent/50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="relative size-8 overflow-hidden rounded-md bg-zinc-800">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              width={32}
              height={32}
              className="size-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-xs font-semibold text-accent">
              {initials(user.email ?? undefined, profile?.username)}
            </span>
          )}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline" title={display}>
          {display}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-500 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="menu-enter absolute right-0 top-[calc(100%+6px)] z-50 min-w-[13rem] rounded-lg border border-zinc-700 bg-surface-sunken py-1 shadow-xl"
        >
          <Link
            href={profileHref}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800/80"
            onClick={() => setOpen(false)}
          >
            <UserRound className="size-4 text-zinc-400" />
            My profile
          </Link>
          <Link
            href="/notifications"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800/80"
            onClick={() => setOpen(false)}
          >
            <Bell className="size-4 text-zinc-400" />
            Notifications
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800/80"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4 text-zinc-400" />
            Settings
          </Link>
          {profile?.is_admin ? (
            <Link
              href="/admin"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800/80"
              onClick={() => setOpen(false)}
            >
              <Shield className="size-4 text-zinc-400" />
              Moderation
            </Link>
          ) : null}
          {/*
            Native <form> + Server Action.
            This survives stale React state, suspended JS contexts after a
            tab switch, expired client-side Supabase sessions, and bfcache
            restoration — the browser submits the form regardless. The
            `signOut` action clears cookies server-side and returns a
            redirect to "/", so the post-logout state is guaranteed.
          */}
          <form action={signOut}>
            <LogoutButton />
          </form>
        </div>
      ) : null}
    </div>
  );
}

/** Compact sign-in for sidebars. */
export function SignInCard({ nextPath = "/" }: { nextPath?: string }) {
  return (
    <SignInWithGoogle
      nextPath={nextPath}
      label="Continue with Google"
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-accent/60 bg-gradient-to-b from-[#00ff9f] to-[#00d986] px-4 py-2.5 text-sm font-semibold text-on-accent shadow-[0_0_0_1px_rgba(0,255,159,0.35),0_8px_20px_-8px_rgba(0,255,159,0.55),inset_0_1px_0_rgba(255,255,255,0.35)] transition duration-[120ms] hover:-translate-y-px disabled:opacity-50"
    />
  );
}
