"use client"

import type React from "react"

import { useToast } from "@/components/ui/use-toast"
import {
  signIn as firebaseSignIn,
  signInWithGithub as firebaseSignInWithGithub,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  signUp as firebaseSignUp,
  updateUserProfile as firebaseUpdateUserProfile,
  getRedirectResult,
  getUserProfile,
  subscribeToAuthChanges,
} from "@/lib/firebase-auth"
import { validateUsername } from "@/lib/validation"
import type { Profile } from "@/types/database"
import type { User as FirebaseUser } from "firebase/auth"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"

// Проверка, что код выполняется в браузере
const isBrowser = typeof window !== "undefined"

interface AuthContextType {
  user: FirebaseUser | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    username: string,
    role?: string,
  ) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{
    user: FirebaseUser | null
    error: any
    profile: Profile | null
  }>
  signInWithGithub: () => Promise<{
    user: FirebaseUser | null
    error: any
    profile: Profile | null
  }>
  updateProfile: (
    profileData: Partial<Profile>,
  ) => Promise<{ success: boolean; error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needsProfileUpdate, setNeedsProfileUpdate] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Проверка имени пользователя и перенаправление на страницу профиля при необходимости
  useEffect(() => {
    if (needsProfileUpdate && profile && !isLoading) {
      toast({
        title: "Пожалуйста, обновите ваш профиль",
        description: "Пожалуйста, введите корректные Имя и Фамилию",
        duration: 5000,
      })
      router.push("/profile?update=username")
      setNeedsProfileUpdate(false)
    }
  }, [needsProfileUpdate, profile, isLoading, router, toast])

  useEffect(() => {
    // Выполняем только на клиенте
    if (!isBrowser) {
      return
    }

    // Проверяем результат редиректа после аутентификации
    const checkRedirectResult = async () => {
      try {
        const { user, error } = await getRedirectResult()

        if (error) {
          console.error("Redirect result error:", error)
          return
        }

        if (user) {
          // Пользователь успешно аутентифицирован через редирект
          const userProfile = await getUserProfile(user.uid)

          // Проверяем имя пользователя на соответствие требованиям
          if (userProfile && userProfile.username) {
            const usernameError = validateUsername(userProfile.username)
            if (usernameError) {
              // Если имя пользователя не соответствует требованиям, перенаправляем на страницу профиля
              toast({
                title: "Пожалуйста, обновите ваш профиль",
                description: "Пожалуйста, введите корректные Имя и Фамилию",
                duration: 5000,
              })
              router.push("/profile?update=username")
            } else {
              // Если имя пользователя соответствует требованиям, перенаправляем на главную страницу
              router.push("/")
            }
          } else {
            // Если профиля нет, перенаправляем на главную страницу
            router.push("/")
          }
        }
      } catch (error) {
        console.error("Error checking redirect result:", error)
      }
    }

    // Проверяем результат редиректа
    checkRedirectResult()

    // Подписываемся на изменения состояния аутентификации
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Получаем профиль пользователя из Firestore
        const userProfile = await getUserProfile(firebaseUser.uid)
        setProfile(userProfile)

        // Проверяем имя пользователя на соответствие требованиям
        if (userProfile && userProfile.username) {
          const usernameError = validateUsername(userProfile.username)
          if (usernameError) {
            setNeedsProfileUpdate(true)
          }
        }
      } else {
        setProfile(null)
        setNeedsProfileUpdate(false)
      }

      setIsLoading(false)
      router.refresh()
    })

    return () => {
      unsubscribe()
    }
  }, [router, toast])

  const signIn = async (email: string, password: string) => {
    const { user, error } = await firebaseSignIn(email, password)
    return { error }
  }

  const signUp = async (
    email: string,
    password: string,
    username: string,
    role = "student",
  ) => {
    // Всегда используем роль student независимо от переданного значения
    const { user, error } = await firebaseSignUp(
      email,
      password,
      username,
      "student",
    )
    return { error }
  }

  const signInWithGoogle = async () => {
    const { user, error } = await firebaseSignInWithGoogle()
    let profile = null
    if (user) {
      profile = await getUserProfile(user.uid)
    }
    return { user, error, profile }
  }

  const signInWithGithub = async () => {
    const { user, error } = await firebaseSignInWithGithub()
    let profile = null
    if (user) {
      profile = await getUserProfile(user.uid)
    }
    return { user, error, profile }
  }

  const signOut = async () => {
    await firebaseSignOut()
    router.push("/")
  }

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) {
      return { success: false, error: { message: "User not authenticated" } }
    }

    const result = await firebaseUpdateUserProfile(user.uid, profileData)

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
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGithub,
        updateProfile,
        signOut,
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
