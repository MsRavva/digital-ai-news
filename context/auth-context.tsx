"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getCurrentUser,
  getUserProfile,
  signIn,
  signInWithGithub,
  signInWithGoogle,
  signOut,
  signUp,
  subscribeToAuthChanges,
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
    role?: string
  ) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGithub: () => Promise<{ error: any }>;
  updateProfile: (profileData: Partial<Profile>) => Promise<{ success: boolean; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileUpdate, setNeedsProfileUpdate] = useState(false);
  const router = useRouter();
  const routerRef = useRef(router);
  const hasRefreshedRef = useRef(false);
  const checkRedirectResultCalledRef = useRef(false);
  const isSubscribedRef = useRef(false);

  // Обновляем ref при изменении router
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Проверка имени пользователя и email, перенаправление на страницу профиля при необходимости
  useEffect(() => {
    if (needsProfileUpdate && profile && !isLoading) {
      const usernameError = validateUsername(profile.username);
      const hasEmail = profile.email && profile.email.trim() !== "";

      if (usernameError || !hasEmail) {
        const description = !hasEmail
          ? "Пожалуйста, укажите ваш email"
          : "Пожалуйста, введите корректные Имя и Фамилию";

        toast.info("Пожалуйста, обновите ваш профиль", {
          description,
        });
        router.push("/profile?update=username");
      }
      setNeedsProfileUpdate(false);
    }
  }, [needsProfileUpdate, profile, isLoading, router]);

  // Функция для обновления сессии в cookie - используем useRef для стабильной ссылки
  const updateSessionInCookieRef = useRef(async (supabaseUser: User) => {
    try {
      // Supabase автоматически управляет сессией через cookies
      // Эта функция оставлена для совместимости, но не требует действий
      console.log("Session updated for user:", supabaseUser.id);
    } catch (error) {
      console.error("Error updating session:", error);
    }
  });

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

    // Таймаут для isLoading - если через 5 секунд не получили ответ, устанавливаем false
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    // Проверяем текущего пользователя при монтировании
    const checkCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          const userProfile = await getUserProfile(currentUser.id);
          setProfile(userProfile);

          // Проверяем имя пользователя и email на соответствие требованиям
          if (userProfile && userProfile.username) {
            const usernameError = validateUsername(userProfile.username);
            const hasEmail = userProfile.email && userProfile.email.trim() !== "";

            if (usernameError || !hasEmail) {
              setNeedsProfileUpdate(true);
            }
          }
        }
      } catch (error) {
        console.error("Error checking current user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Проверяем текущего пользователя только один раз при монтировании
    checkCurrentUser();

    // Подписываемся на изменения состояния аутентификации
    const unsubscribeAuth = subscribeToAuthChanges(async (supabaseUser) => {
      try {
        clearTimeout(loadingTimeout);
        setUser(supabaseUser);

        if (supabaseUser) {
          // Обновляем сессию
          await updateSessionInCookieRef.current(supabaseUser);

          // Получаем профиль пользователя из Supabase
          const userProfile = await getUserProfile(supabaseUser.id);

          // Обновляем email в профиле, если его нет, но есть в Supabase Auth
          if (userProfile && !userProfile.email && supabaseUser.email) {
            try {
              await updateUserProfile(supabaseUser.id, {
                email: supabaseUser.email,
              });
              // Обновляем локальный профиль
              userProfile.email = supabaseUser.email;
            } catch (error) {
              console.error("Error updating email in profile:", error);
            }
          }

          setProfile(userProfile);

          // Проверяем имя пользователя и email на соответствие требованиям
          if (userProfile && userProfile.username) {
            const usernameError = validateUsername(userProfile.username);
            const hasEmail = userProfile.email && userProfile.email.trim() !== "";

            if (usernameError || !hasEmail) {
              setNeedsProfileUpdate(true);
            }
          }
        } else {
          setProfile(null);
          setNeedsProfileUpdate(false);
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error);
      } finally {
        // Всегда устанавливаем isLoading в false после обработки
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      isSubscribedRef.current = false;
      unsubscribeAuth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    return { error };
  };

  const handleSignUp = async (
    email: string,
    password: string,
    username: string,
    role = "student"
  ) => {
    // Всегда используем роль student независимо от переданного значения
    const { error } = await signUp(email, password, username, "student");
    return { error };
  };

  const handleSignInWithGoogle = async () => {
    const { error } = await signInWithGoogle();
    return { error };
  };

  const handleSignInWithGithub = async () => {
    const { error } = await signInWithGithub();
    return { error };
  };

  const handleSignOut = async () => {
    await signOut();

    // Используем window.location для полного редиректа
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
