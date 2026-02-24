import type { AuthError, User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { supabase } from "./supabase";

function resolveOAuthReturnPath(): string {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const redirectFromQuery = searchParams.get("redirect");

  if (redirectFromQuery?.startsWith("/") && !redirectFromQuery.startsWith("//")) {
    return redirectFromQuery;
  }

  if (!["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname)) {
    return pathname;
  }

  return "/";
}

// Регистрация нового пользователя
// ВАЖНО: Роль всегда 'student' на этапе регистрации
// Изменение роли возможно только администратором через admin panel
export const signUp = async (
  email: string,
  password: string,
  username: string,
  _role?: "student" | "teacher" | "admin"
): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    // Принудительно устанавливаем роль 'student' - серверная валидация
    // Любое значение role из клиента игнорируется
    const role = "student";

    // Создаем пользователя в Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role,
        },
      },
    });

    if (error) {
      console.error("Error signing up:", error);
      return { user: null, error };
    }

    if (!data.user) {
      return { user: null, error: { message: "User creation failed" } as AuthError };
    }

    // Профиль создастся автоматически через database trigger

    return { user: data.user, error: null };
  } catch (error) {
    console.error("Unexpected error during sign up:", error);
    return { user: null, error: error as AuthError };
  }
};

// Вход пользователя
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in:", error);
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error("Unexpected error during sign in:", error);
    return { user: null, error: error as AuthError };
  }
};

// Генерация CSRF state для OAuth
function generateCSRFState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Вход через Google
export const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
  try {
    // Убираем force signOut чтобы избежать race condition
    // PKCE flow самостоятельно управляет сессией
    // Старые сессии будут заменены после успешного OAuth callback

    const returnPath = resolveOAuthReturnPath();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (returnPath !== "/") {
      callbackUrl.searchParams.set("next", returnPath);
    }

    // Генерируем и сохраняем CSRF state
    const state = generateCSRFState();
    sessionStorage.setItem("oauth_state", state);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          state: state,
        },
      },
    });

    if (error) {
      console.error("Error signing in with Google:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Unexpected error during Google sign in:", error);
    return { error: error as AuthError };
  }
};

// Вход через GitHub
export const signInWithGithub = async (): Promise<{ error: AuthError | null }> => {
  try {
    // Убираем force signOut чтобы избежать race condition
    // PKCE flow самостоятельно управляет сессией
    // Старые сессии будут заменены после успешного OAuth callback

    const returnPath = resolveOAuthReturnPath();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (returnPath !== "/") {
      callbackUrl.searchParams.set("next", returnPath);
    }

    // Генерируем и сохраняем CSRF state
    const state = generateCSRFState();
    sessionStorage.setItem("oauth_state", state);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          state: state,
        },
      },
    });

    if (error) {
      console.error("Error signing in with GitHub:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Unexpected error during GitHub sign in:", error);
    return { error: error as AuthError };
  }
};

// Выход пользователя
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Unexpected error during sign out:", error);
    return { error: error as AuthError };
  }
};

// Получение текущего пользователя
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Error getting current user:", error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Unexpected error getting current user:", error);
    return null;
  }
};

// Получение профиля пользователя
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    // Используем обычный клиент - RLS политики должны разрешать чтение своего профиля
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("Error fetching user profile:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      username: data.username,
      email: data.email || undefined,
      role: data.role as Profile["role"],
      created_at: data.created_at,
      updated_at: data.updated_at || undefined,
      bio: data.bio || undefined,
      location: data.location || undefined,
      website: data.website || undefined,
      social: data.social as Profile["social"] | undefined,
      avatar_url: data.avatar_url || undefined,
      preferredCategory: data.preferred_category || undefined,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Обновление профиля пользователя
// ВАЖНО: Роль (role) не может быть изменена через этот метод
// Изменение роли возможно только администратором через отдельный admin API
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<Profile>
): Promise<{ success: boolean; error: any }> => {
  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (profileData.username !== undefined) {
      updateData.username = profileData.username;
    }
    if (profileData.email !== undefined) {
      updateData.email = profileData.email;
    }
    // ВАЖНО: Игнорируем попытки изменить role - это может делать только admin
    if (profileData.role !== undefined) {
      console.warn("Attempt to update role blocked - role can only be changed by admin");
    }
    if (profileData.bio !== undefined) {
      updateData.bio = profileData.bio;
    }
    if (profileData.location !== undefined) {
      updateData.location = profileData.location;
    }
    if (profileData.website !== undefined) {
      updateData.website = profileData.website;
    }
    if (profileData.social !== undefined) {
      updateData.social = profileData.social;
    }
    if (profileData.avatar_url !== undefined) {
      updateData.avatar_url = profileData.avatar_url;
    }
    if (profileData.preferredCategory !== undefined) {
      updateData.preferred_category = profileData.preferredCategory;
    }

    // Используем обычный клиент - RLS политики должны разрешать обновление своего профиля
    const { error } = await supabase.from("profiles").update(updateData).eq("id", userId);

    if (error) {
      console.error("Error updating user profile:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error };
  }
};

// Создание профиля пользователя
export const createUserProfile = async (
  userId: string,
  profileData: {
    username: string;
    email?: string;
    role?: "student" | "teacher" | "admin";
  }
): Promise<{ success: boolean; error: any }> => {
  try {
    // Используем обычный клиент - RLS политики должны разрешать создание профиля
    // Обычно это делается через database trigger, но на случай если нужно вручную
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      username: profileData.username,
      email: profileData.email || null,
      role: profileData.role || "student",
    });

    if (error) {
      console.error("Error creating user profile:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error creating user profile:", error);
    return { success: false, error };
  }
};

// Сброс пароля (отправка email с ссылкой для сброса)
export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("Error resetting password:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Unexpected error during password reset:", error);
    return { error: error as AuthError };
  }
};

// Обновление пароля (после перехода по ссылке из email)
export const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Error updating password:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Unexpected error during password update:", error);
    return { error: error as AuthError };
  }
};

// Подписка на изменения состояния аутентификации
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
};
