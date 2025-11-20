"use client"

import type React from "react"
import { toast } from "sonner"
import {
  signIn,
  signUp,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  subscribeToAuthChanges,
} from "@/lib/supabase-auth"
import { supabase } from "@/lib/supabase"
import { validateUsername } from "@/lib/validation"
import type { Profile } from "@/types/database"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState, useRef } from "react"

// Проверка, что код выполняется в браузере
const isBrowser = typeof window !== "undefined"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    username: string,
    role?: "student" | "teacher" | "admin",
  ) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signInWithGithub: () => Promise<{ error: any }>
  updateProfile: (
    profileData: Partial<Profile>,
  ) => Promise<{ success: boolean; error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const isSubscribedRef = useRef(false)

  useEffect(() => {
    // Выполняем только на клиенте
    if (!isBrowser) {
      setIsLoading(false)
      return
    }

    // Защита от повторных подписок
    if (isSubscribedRef.current) {
      return
    }
    isSubscribedRef.current = true

    // Таймаут для isLoading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 5000)

    // Получаем текущую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setIsLoading(false)
        clearTimeout(loadingTimeout)
      } else {
        setIsLoading(false)
        clearTimeout(loadingTimeout)
      }
    }).catch((error) => {
      console.error("Error getting session:", error)
      setIsLoading(false)
      clearTimeout(loadingTimeout)
    })

    // Подписываемся на изменения состояния аутентификации
    const unsubscribe = subscribeToAuthChanges(async (supabaseUser) => {
      try {
        clearTimeout(loadingTimeout)
        setUser(supabaseUser)

        if (supabaseUser) {
          // Получаем профиль пользователя
          const userProfile = await getUserProfile(supabaseUser.id)
          setProfile(userProfile)
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error("Error in auth state change handler:", error)
      } finally {
        setIsLoading(false)
      }
    })

    return () => {
      clearTimeout(loadingTimeout)
      isSubscribedRef.current = false
      unsubscribe()
    }
  }, [router])

  const handleSignIn = async (email: string, password: string) => {
    const { user: signedInUser, error } = await signIn(email, password)
    return { error }
  }

  const handleSignUp = async (
    email: string,
    password: string,
    username: string,
    role: "student" | "teacher" | "admin" = "student",
  ) => {
    const { user: signedUpUser, error } = await signUp(email, password, username, role)
    return { error }
  }

  const handleSignInWithGoogle = async () => {
    const { error } = await signInWithGoogle()
    // OAuth редиректит на callback, который обработает вход
    return { error }
  }

  const handleSignInWithGithub = async () => {
    const { error } = await signInWithGithub()
    // OAuth редиректит на callback, который обработает вход
    return { error }
  }

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
    setProfile(null)
    router.push("/login")
  }

  const handleUpdateProfile = async (profileData: Partial<Profile>) => {
    if (!user) {
      return { success: false, error: { message: "User not authenticated" } }
    }

    const result = await updateUserProfile(user.id, profileData)

    // Если обновление прошло успешно, обновляем локальный профиль
    if (result.success && profile) {
      setProfile({ ...profile, ...profileData })
    }

    return result
  }

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
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
