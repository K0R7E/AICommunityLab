import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import {
  AuthProvider,
  type ProfileSummary,
} from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/shell/site-header";
import { Sidebar } from "@/components/shell/sidebar";
import { RightPanel } from "@/components/shell/right-panel";
import { SubmitFab } from "@/components/shell/submit-fab";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AICommunityLab",
  description: "Discover and share AI tools — community-driven feed",
};

function RightPanelFallback() {
  return (
    <aside className="flex flex-col gap-6">
      <div className="h-32 animate-pulse rounded-xl bg-zinc-800/50" />
      <div className="h-40 animate-pulse rounded-xl bg-zinc-800/50" />
    </aside>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userEmail = user?.email ?? null;

  let initialProfile: ProfileSummary | null = null;
  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    initialProfile = profileRow
      ? {
          username: profileRow.username,
          avatar_url: profileRow.avatar_url,
        }
      : null;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0f0f0f] font-sans text-zinc-100">
        <AuthProvider
          key={`${user?.id ?? "anon"}:${initialProfile?.username ?? ""}:${initialProfile?.avatar_url ?? ""}`}
          initialUser={user ?? null}
          initialProfile={initialProfile}
        >
          <SiteHeader />
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
            <div className="mb-8 lg:hidden">
              <Sidebar />
            </div>
            <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
              <aside className="hidden lg:block">
                <Sidebar />
              </aside>
              <main className="min-w-0">{children}</main>
              <aside className="hidden lg:block">
                <Suspense fallback={<RightPanelFallback />}>
                  <RightPanel userEmail={userEmail} />
                </Suspense>
              </aside>
            </div>
          </div>
          <SubmitFab />
        </AuthProvider>
        <Toaster richColors theme="dark" position="top-center" />
      </body>
    </html>
  );
}
