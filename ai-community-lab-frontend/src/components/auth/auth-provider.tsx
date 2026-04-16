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
>;

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
      .select("username, avatar_url, is_admin")
      .eq("id", u.id)
      .maybeSingle();
    setProfile(
      data
        ? {
            username: data.username,
            avatar_url: data.avatar_url,
            is_admin: Boolean((data as { is_admin?: boolean }).is_admin),
          }
        : null,
    );
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
          .select("username, avatar_url, is_admin")
          .eq("id", nextUser.id)
          .maybeSingle();
        setProfile(
          data
            ? {
                username: data.username,
                avatar_url: data.avatar_url,
                is_admin: Boolean((data as { is_admin?: boolean }).is_admin),
              }
            : null,
        );
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
