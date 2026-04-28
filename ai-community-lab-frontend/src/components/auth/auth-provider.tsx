"use client";

import { createClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/types/profile";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ProfileSummary = Pick<
  ProfileRow,
  "username" | "avatar_url" | "is_admin"
> & {
  /** First-login consent gate: true once the user has accepted Terms + Privacy. */
  has_accepted_terms: boolean;
  /** Version of terms the user accepted; null until first acceptance. */
  accepted_terms_version: string | null;
};

type AuthContextValue = {
  user: User | null;
  profile: ProfileSummary | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type Props = {
  children: React.ReactNode;
  initialUser: User | null;
  initialProfile: ProfileSummary | null;
};

const PROFILE_COLUMNS =
  "username, avatar_url, is_admin, has_accepted_terms, accepted_terms_version";

type ProfileQueryRow = {
  username: string;
  avatar_url: string | null;
  is_admin?: boolean | null;
  has_accepted_terms?: boolean | null;
  accepted_terms_version?: string | null;
};

function toSummary(row: ProfileQueryRow | null | undefined): ProfileSummary | null {
  if (!row) return null;
  return {
    username: row.username,
    avatar_url: row.avatar_url,
    is_admin: Boolean(row.is_admin),
    has_accepted_terms: Boolean(row.has_accepted_terms),
    accepted_terms_version: row.accepted_terms_version ?? null,
  };
}

export function AuthProvider({
  children,
  initialUser,
  initialProfile,
}: Props) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<ProfileSummary | null>(
    initialProfile,
  );
  const supabase = useMemo(() => createClient(), []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", u.id)
      .maybeSingle();
    setProfile(toSummary(data as ProfileQueryRow | null));
  }, [supabase]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        const { data } = await supabase
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .eq("id", nextUser.id)
          .maybeSingle();
        setProfile(toSummary(data as ProfileQueryRow | null));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      refreshProfile,
    }),
    [user, profile, refreshProfile],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
