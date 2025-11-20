import { supabase } from "./supabase"
import { saveReturnUrl } from "./auth-helpers"
import type { Profile } from "@/types/database"
import type { User, AuthError } from "@supabase/supabase-js"

// Регистрация нового пользователя
export const signUp = async (
  email: string,
  password: string,
  username: string,
  role: "student" | "teacher" | "admin" = "student"
): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
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
    })

    if (error) {
      console.error("Error signing up:", error)
      return { user: null, error }
    }

    if (!data.user) {
      return { user: null, error: { message: "User creation failed" } as AuthError }
    }

    // Профиль создастся автоматически через database trigger

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Unexpected error during sign up:", error)
    return { user: null, error: error as AuthError }
  }
}

// Вход пользователя
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Error signing in:", error)
      return { user: null, error }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Unexpected error during sign in:", error)
    return { user: null, error: error as AuthError }
  }
}

// Вход через Google
export const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
  try {
    saveReturnUrl(window.location.pathname)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("Error signing in with Google:", error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error("Unexpected error during Google sign in:", error)
    return { error: error as AuthError }
  }
}

// Вход через GitHub
export const signInWithGithub = async (): Promise<{ error: AuthError | null }> => {
  try {
    saveReturnUrl(window.location.pathname)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("Error signing in with GitHub:", error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error("Unexpected error during GitHub sign in:", error)
    return { error: error as AuthError }
  }
}

// Выход пользователя
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error("Unexpected error during sign out:", error)
    return { error: error as AuthError }
  }
}

// Получение текущего пользователя
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error)
      return null
    }

    return data.user
  } catch (error) {
    console.error("Unexpected error getting current user:", error)
    return null
  }
}

// Получение профиля пользователя
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    // Используем обычный клиент - RLS политики должны разрешать чтение своего профиля
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      console.error("Error fetching user profile:", error)
      return null
    }

    if (!data) {
      return null
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
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

// Обновление профиля пользователя
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<Profile>,
): Promise<{ success: boolean; error: any }> => {
  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (profileData.username !== undefined) {
      updateData.username = profileData.username
    }
    if (profileData.email !== undefined) {
      updateData.email = profileData.email
    }
    if (profileData.role !== undefined) {
      updateData.role = profileData.role
    }
    if (profileData.bio !== undefined) {
      updateData.bio = profileData.bio
    }
    if (profileData.location !== undefined) {
      updateData.location = profileData.location
    }
    if (profileData.website !== undefined) {
      updateData.website = profileData.website
    }
    if (profileData.social !== undefined) {
      updateData.social = profileData.social
    }
    if (profileData.avatar_url !== undefined) {
      updateData.avatar_url = profileData.avatar_url
    }
    if (profileData.preferredCategory !== undefined) {
      updateData.preferred_category = profileData.preferredCategory
    }

    // Используем обычный клиент - RLS политики должны разрешать обновление своего профиля
    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)

    if (error) {
      console.error("Error updating user profile:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error }
  }
}

// Создание профиля пользователя
export const createUserProfile = async (
  userId: string,
  profileData: {
    username: string
    email?: string
    role?: "student" | "teacher" | "admin"
  },
): Promise<{ success: boolean; error: any }> => {
  try {
    // Используем обычный клиент - RLS политики должны разрешать создание профиля
    // Обычно это делается через database trigger, но на случай если нужно вручную
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      username: profileData.username,
      email: profileData.email || null,
      role: profileData.role || "student",
    })

    if (error) {
      console.error("Error creating user profile:", error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error creating user profile:", error)
    return { success: false, error }
  }
}

// Подписка на изменения состояния аутентификации
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null)
    }
  )

  return () => {
    subscription.unsubscribe()
  }
}
