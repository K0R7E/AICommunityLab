"use client";

import { createClient } from "@/lib/supabase/client";
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
import { toast } from "sonner";
import { useAuth } from "./auth-provider";
import { safeRelativeNextPath } from "@/lib/safe-next-path";
import { SignInWithGoogle } from "./sign-in-google";
import { safeHttpsImageUrl } from "@/lib/safe-remote-media-url";

function initials(email: string | undefined, username: string | undefined) {
  if (username?.length) return username.slice(0, 2).toUpperCase();
  if (email?.length) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function UserMenu() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function signOut() {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch("/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || body.ok !== true) {
        throw new Error("Server sign-out failed");
      }
      await supabase.auth.signOut();
      toast.success("Signed out");
      window.location.assign("/");
    } catch {
      const { error } = await supabase.auth.signOut();
      if (error) toast.error(error.message);
      else {
        toast.success("Signed out");
        window.location.assign("/");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    const next = safeRelativeNextPath(pathname.startsWith("/login") ? "/" : pathname);
    return (
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-[#00ff9f]/50"
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
        className="flex min-h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-[#1a1a1a] py-1.5 pl-1.5 pr-2 text-sm text-zinc-200 transition hover:border-[#00ff9f]/50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="relative size-8 overflow-hidden rounded-md bg-zinc-800">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar URLs
            <img
              src={avatarUrl}
              alt=""
              width={32}
              height={32}
              className="size-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-xs font-semibold text-[#00ff9f]">
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
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[13rem] rounded-lg border border-zinc-700 bg-[#141414] py-1 shadow-xl"
        >
          <Link
            href={profileHref}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800/80"
            onClick={() => setOpen(false)}
          >
            <UserRound className="size-4 text-zinc-400" />
            My profile
          </Link>
          <Link
            href="/notifications"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800/80"
            onClick={() => setOpen(false)}
          >
            <Bell className="size-4 text-zinc-400" />
            Notifications
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800/80"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4 text-zinc-400" />
            Settings
          </Link>
          {profile?.is_admin ? (
            <Link
              href="/admin"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800/80"
              onClick={() => setOpen(false)}
            >
              <Shield className="size-4 text-zinc-400" />
              Moderation
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void signOut();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800/80 disabled:opacity-50"
          >
            <LogOut className="size-4 text-zinc-400" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Compact sign-in for sidebars (same Google flow, optional next path). */
export function SignInCard({ nextPath = "/" }: { nextPath?: string }) {
  return (
    <SignInWithGoogle
      nextPath={nextPath}
      label="Continue with Google"
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#00ff9f] px-4 py-2.5 text-sm font-medium text-[#0f0f0f] transition hover:bg-[#33ffa8] disabled:opacity-50"
    />
  );
}
