"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  getUserProfile,
  resetPassword,
  signIn,
  signInWithGithub,
  signInWithGoogle,
  signOut,
  signUp,
  subscribeToAuthChanges,
  updatePassword,
  updateUserProfile,
} from "@/lib/supabase-auth";
import type { Profile } from "@/types/database";

// Проверка, что код выполняется в браузере
const isBrowser = typeof window !== "undefined";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    username: string,
    role?: "student" | "teacher" | "admin"
  ) => Promise<{ error: any }>;
  signInWithGoogle: (next?: string) => Promise<{ error: any }>;
  signInWithGithub: (next?: string) => Promise<{ error: any }>;
  updateProfile: (profileData: Partial<Profile>) => Promise<{ success: boolean; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_RETRY_DELAYS_MS = [0, 300, 800, 1500];

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadUserProfileWithRetry(userId: string): Promise<Profile | null> {
  for (const delayMs of PROFILE_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await wait(delayMs);
    }

    const userProfile = await getUserProfile(userId);

    if (userProfile) {
      return userProfile;
    }
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // Выполняем только на клиенте
    if (!isBrowser) {
      setIsLoading(false);
      return;
    }

    // Защита от повторных подписок
    if (isSubscribedRef.current) {
      return;
    }
    isSubscribedRef.current = true;

    // Таймаут для isLoading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    // Получаем текущую сессию
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);

          try {
            const userProfile = await loadUserProfileWithRetry(session.user.id);
            setProfile(userProfile);

            if (!userProfile) {
              console.warn(
                `[AuthProvider] Не удалось загрузить профиль после восстановления сессии. user.id=${session.user.id}`
              );
            }
          } catch (error) {
            console.error("Error loading profile:", error);
          }
          setIsLoading(false);
          clearTimeout(loadingTimeout);
        } else {
          setIsLoading(false);
          clearTimeout(loadingTimeout);
        }
      })
      .catch((error) => {
        console.error("Error getting session:", error);
        setIsLoading(false);
        clearTimeout(loadingTimeout);
      });

    // Подписываемся на изменения состояния аутентификации
    const unsubscribe = subscribeToAuthChanges(async (supabaseUser) => {
      try {
        clearTimeout(loadingTimeout);
        setUser(supabaseUser);

        if (supabaseUser) {
          const userProfile = await loadUserProfileWithRetry(supabaseUser.id);

          setProfile(userProfile);

          if (!userProfile) {
            console.warn(
              `[AuthProvider] Профиль не найден после auth state change. user.id=${supabaseUser.id}`
            );
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      isSubscribedRef.current = false;
      unsubscribe();
    };
  }, [router]);

  const handleSignIn = async (email: string, password: string) => {
    const { user: signedInUser, error } = await signIn(email, password);
    return { error };
  };

  const handleSignUp = async (
    email: string,
    password: string,
    username: string,
    role: "student" | "teacher" | "admin" = "student"
  ) => {
    const { user: signedUpUser, error } = await signUp(email, password, username, role);
    return { error };
  };

  const handleSignInWithGoogle = async (next?: string) => {
    const { error } = await signInWithGoogle(next);
    // OAuth редиректит на callback, который обработает вход
    return { error };
  };

  const handleSignInWithGithub = async (next?: string) => {
    const { error } = await signInWithGithub(next);
    // OAuth редиректит на callback, который обработает вход
    return { error };
  };

  const handleSignOut = async () => {
    await signOut();
    // signOut() делает редирект на /login
    // setUser и setProfile будут вызваны через onAuthStateChange
  };

  const handleUpdateProfile = async (profileData: Partial<Profile>) => {
    if (!user) {
      return { success: false, error: { message: "User not authenticated" } };
    }

    const result = await updateUserProfile(user.id, profileData);

    // Если обновление прошло успешно, обновляем локальный профиль
    if (result.success && profile) {
      setProfile({ ...profile, ...profileData });
    }

    return result;
  };

  const handleResetPassword = async (email: string) => {
    return await resetPassword(email);
  };

  const handleUpdatePassword = async (newPassword: string) => {
    return await updatePassword(newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithGithub: handleSignInWithGithub,
        updateProfile: handleUpdateProfile,
        signOut: handleSignOut,
        resetPassword: handleResetPassword,
        updatePassword: handleUpdatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
