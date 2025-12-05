"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
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
import { validateUsername } from "@/lib/validation";
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
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGithub: () => Promise<{ error: any }>;
  updateProfile: (profileData: Partial<Profile>) => Promise<{ success: boolean; error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          // Загружаем профиль сразу после получения сессии
          try {
            const userProfile = await getUserProfile(session.user.id);
            setProfile(userProfile);
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
          // Получаем профиль пользователя
          // Для OAuth пользователей профиль может создаваться с задержкой через триггер
          // Делаем несколько попыток с небольшими задержками
          let userProfile = await getUserProfile(supabaseUser.id);

          // Если профиль не найден, ждем немного и пробуем еще раз (для OAuth)
          if (!userProfile) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            userProfile = await getUserProfile(supabaseUser.id);
          }

          // Еще одна попытка через секунду
          if (!userProfile) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            userProfile = await getUserProfile(supabaseUser.id);
          }

          setProfile(userProfile);
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

  const handleSignInWithGoogle = async () => {
    const { error } = await signInWithGoogle();
    // OAuth редиректит на callback, который обработает вход
    return { error };
  };

  const handleSignInWithGithub = async () => {
    const { error } = await signInWithGithub();
    // OAuth редиректит на callback, который обработает вход
    return { error };
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    // Используем window.location для полного редиректа после выхода
    if (isBrowser) {
      window.location.href = "/login";
    } else {
      router.push("/login");
      router.refresh();
    }
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
