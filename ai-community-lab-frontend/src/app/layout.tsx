import type { Metadata } from "next";
import { getSiteMetadataBase } from "@/lib/site-metadata-base";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import {
  AuthProvider,
  type ProfileSummary,
} from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/shell/site-header";
import { OnboardingBanner } from "@/components/shell/onboarding-banner";
import { SiteFooter } from "@/components/shell/site-footer";
import { Sidebar } from "@/components/shell/sidebar";
import { RightPanel } from "@/components/shell/right-panel";
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
  metadataBase: new URL(getSiteMetadataBase()),
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
      .select("username, avatar_url, is_admin")
      .eq("id", user.id)
      .maybeSingle();
    initialProfile = profileRow
      ? {
          username: profileRow.username,
          avatar_url: profileRow.avatar_url,
          is_admin: Boolean((profileRow as { is_admin?: boolean }).is_admin),
        }
      : null;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#0f0f0f] font-sans text-zinc-100">
        <AuthProvider
          key={`${user?.id ?? "anon"}:${initialProfile?.username ?? ""}:${initialProfile?.avatar_url ?? ""}`}
          initialUser={user ?? null}
          initialProfile={initialProfile}
        >
          <SiteHeader />

          <aside
            className="shell-sidebar-left hidden lg:block"
            aria-label="Primary navigation"
          >
            <Sidebar />
          </aside>
          <aside
            className="shell-sidebar-right hidden lg:block"
            aria-label="Trending and actions"
          >
            <Suspense fallback={<RightPanelFallback />}>
              <RightPanel userEmail={userEmail} />
            </Suspense>
          </aside>

          <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-24 pt-6 sm:px-6 lg:max-w-none lg:px-0">
            <div className="mb-8 lg:hidden">
              <div className="sticky top-14 z-20 -mx-4 max-h-[calc(100dvh-6.5rem)] overflow-y-auto overflow-x-hidden border-b border-zinc-800/60 bg-[#0f0f0f]/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
                <Sidebar />
              </div>
            </div>
            <main className="shell-main-with-sidebars min-w-0">
              <OnboardingBanner />
              {children}
            </main>
          </div>

          <SiteFooter />
        </AuthProvider>
        <Toaster richColors theme="dark" position="top-center" />
      </body>
    </html>
  );
}
