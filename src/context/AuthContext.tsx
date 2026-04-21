import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase";

type NotificationSettings = {
  email?: boolean;
  push?: boolean;
  inApp?: boolean;
  earlyWarning?: string;
  paymentDay?: string;
};

type ProfileData = {
  id: string;
  legacyFirebaseUid: string | null;
  name: string;
  email: string | null;
  bio: string;
  photoURL: string | null;
  currency: string;
  notifications: Required<NotificationSettings>;
  createdAt: string | null;
  updatedAt: string | null;
};

type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: {
    name: string;
    bio?: string;
    photoURL?: string;
    avatarFile?: File;
    notifications?: NotificationSettings;
  }) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  profileData: ProfileData | null;
  isPasswordRecovery: boolean;
  isMock: boolean;
}

const DEFAULT_NOTIFICATIONS: Required<NotificationSettings> = {
  email: true,
  push: false,
  inApp: true,
  earlyWarning: "3",
  paymentDay: "due",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapProfile(row: Record<string, any> | null): ProfileData | null {
  if (!row) return null;

  return {
    id: row.id,
    legacyFirebaseUid: row.legacy_firebase_uid ?? null,
    name: row.name ?? "User",
    email: row.email ?? null,
    bio: row.bio ?? "",
    photoURL: row.photo_url ?? null,
    currency: row.currency ?? "LKR",
    notifications: {
      ...DEFAULT_NOTIFICATIONS,
      ...(row.notifications ?? {}),
    },
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function buildDisplayName(user: User, profile: ProfileData | null) {
  return (
    profile?.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User"
  );
}

function mapCurrentUser(user: User, profile: ProfileData | null): AppUser {
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: buildDisplayName(user, profile),
    photoURL: profile?.photoURL ?? user.user_metadata?.avatar_url ?? null,
  };
}

async function ensureProfile(user: User) {
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    return mapProfile(existing);
  }

  const insertPayload = {
    id: user.id,
    name: buildDisplayName(user, null),
    email: user.email ?? null,
    bio: "",
    photo_url: user.user_metadata?.avatar_url ?? null,
    currency: "LKR",
    notifications: DEFAULT_NOTIFICATIONS,
  };

  const { error: insertError } = await supabase.from("profiles").insert(insertPayload);
  if (insertError) {
    throw insertError;
  }

  const { data: created, error: createdError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (createdError) {
    throw createdError;
  }

  return mapProfile(created);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const syncFromSession = async (session: Session | null) => {
    if (!session?.user) {
      setCurrentUser(null);
      setProfileData(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await ensureProfile(session.user);
      setProfileData(profile);
      setCurrentUser(mapCurrentUser(session.user, profile));
    } catch (err) {
      console.error("Error syncing Supabase profile:", err);
      setCurrentUser(mapCurrentUser(session.user, null));
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error restoring Supabase session:", error);
      }
      if (!cancelled) {
        await syncFromSession(data.session);
      }
    };

    void initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      } else if (event === "SIGNED_OUT") {
        setIsPasswordRecovery(false);
      }

      void syncFromSession(session);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const register = async (name: string, email: string, pass: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name,
          display_name: name,
        },
      },
    });

    if (error) throw error;
    if (data.user) {
      const profile = await ensureProfile(data.user);
      setProfileData(profile);
      setCurrentUser(mapCurrentUser(data.user, profile));
    }
  };

  const resetPassword = async (email: string) => {
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/login?mode=recovery` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setIsPasswordRecovery(false);
  };

  const loginWithGoogle = async () => {
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCurrentUser(null);
    setProfileData(null);
    setIsPasswordRecovery(false);
  };

  const updateUserProfile = async ({
    name,
    bio,
    photoURL,
    avatarFile,
    notifications,
  }: {
    name: string;
    bio?: string;
    photoURL?: string;
    avatarFile?: File;
    notifications?: NotificationSettings;
  }) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("No user logged in");

    let finalPhotoURL = photoURL || profileData?.photoURL || user.user_metadata?.avatar_url || null;

    if (avatarFile) {
      if (!avatarFile.type.startsWith("image/")) {
        throw new Error("Only image uploads are allowed.");
      }

      if (avatarFile.size > 5 * 1024 * 1024) {
        throw new Error("Avatar uploads must be 5 MB or smaller.");
      }

      const timestamp = Date.now();
      const objectPath = `avatars/${user.id}/avatar-${timestamp}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(objectPath, avatarFile, {
        contentType: avatarFile.type,
        upsert: false,
      });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(objectPath);
      finalPhotoURL = publicUrlData.publicUrl;
    }

    const { data: authUpdateData, error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: name,
        display_name: name,
        avatar_url: finalPhotoURL,
      },
    });

    if (authUpdateError) {
      throw new Error(`Failed to update profile metadata: ${authUpdateError.message}`);
    }

    const updatePayload: Record<string, unknown> = {
      name,
      bio: bio ?? "",
      photo_url: finalPhotoURL,
    };

    if (notifications) {
      updatePayload.notifications = {
        ...DEFAULT_NOTIFICATIONS,
        ...notifications,
      };
    }

    const { error: profileUpdateError } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);
    if (profileUpdateError) {
      throw new Error(`Failed to update profile: ${profileUpdateError.message}`);
    }

    const { data: refreshedProfile, error: refreshedProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (refreshedProfileError) {
      throw refreshedProfileError;
    }

    const nextProfile = mapProfile(refreshedProfile);
    const nextUser = authUpdateData.user ?? user;
    setProfileData(nextProfile);
    setCurrentUser(mapCurrentUser(nextUser, nextProfile));
  };

  const getAccessToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  };

  const value = {
    currentUser,
    profileData,
    loading,
    login,
    register,
    resetPassword,
    updatePassword,
    loginWithGoogle,
    logout,
    updateUserProfile,
    getAccessToken,
    isPasswordRecovery,
    isMock: false,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
