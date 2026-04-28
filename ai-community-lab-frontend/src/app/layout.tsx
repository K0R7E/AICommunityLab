import type { Metadata, Viewport } from "next";
import { getSiteMetadataBase } from "@/lib/site-metadata-base";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import {
  AuthProvider,
  type ProfileSummary,
} from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/shell/site-header";
import { SiteFooter } from "@/components/shell/site-footer";
import { Sidebar } from "@/components/shell/sidebar";
import { RightPanel } from "@/components/shell/right-panel";
import { ThemeProvider } from "@/components/shell/theme-provider";
import { ThemedToaster } from "@/components/shell/themed-toaster";
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
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
  ],
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

  let initialProfile: ProfileSummary | null = null;
  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select(
        "username, avatar_url, is_admin, has_accepted_terms, accepted_terms_version",
      )
      .eq("id", user.id)
      .maybeSingle();
    initialProfile = profileRow
      ? {
          username: profileRow.username,
          avatar_url: profileRow.avatar_url,
          is_admin: Boolean((profileRow as { is_admin?: boolean }).is_admin),
          has_accepted_terms: Boolean(
            (profileRow as { has_accepted_terms?: boolean })
              .has_accepted_terms,
          ),
          accepted_terms_version:
            (profileRow as { accepted_terms_version?: string | null })
              .accepted_terms_version ?? null,
        }
      : null;
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className="flex min-h-full flex-col bg-background font-sans text-zinc-100">
        <ThemeProvider>
          <AuthProvider
            key={`${user?.id ?? "anon"}:${initialProfile?.username ?? ""}:${initialProfile?.avatar_url ?? ""}`}
            initialUser={user ?? null}
            initialProfile={initialProfile}
          >
            <div className="hero-gradient" aria-hidden />
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
                <RightPanel />
              </Suspense>
            </aside>

            <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:max-w-none lg:px-0">
              {/* Mobile: compact sticky nav bar (links only) */}
              <div className="mb-4 lg:hidden">
                <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 border-b border-zinc-800/60 bg-background/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6">
                  <Sidebar mobileCompact />
                </div>
              </div>
              <main className="shell-main-with-sidebars min-w-0">
                {children}
              </main>
            </div>

            <SiteFooter />
          </AuthProvider>
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
