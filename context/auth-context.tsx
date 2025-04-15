"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User as FirebaseUser } from "firebase/auth"
import type { Profile } from "@/types/database"
import { signIn as firebaseSignIn, signUp as firebaseSignUp, signOut as firebaseSignOut, getUserProfile, updateUserProfile as firebaseUpdateUserProfile, subscribeToAuthChanges, signInWithGoogle as firebaseSignInWithGoogle, signInWithGithub as firebaseSignInWithGithub } from "@/lib/firebase-auth"
import { validateUsername } from "@/lib/validation"
import { useToast } from "@/components/ui/use-toast"

// Проверка, что код выполняется в браузере
const isBrowser = typeof window !== 'undefined';

interface AuthContextType {
  user: FirebaseUser | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string, role?: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signInWithGithub: () => Promise<{ error: any }>
  updateProfile: (profileData: Partial<Profile>) => Promise<{ success: boolean; error: any }>
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
      router.push('/profile')
      setNeedsProfileUpdate(false)
    }
  }, [needsProfileUpdate, profile, isLoading, router, toast])

  useEffect(() => {
    // Выполняем только на клиенте
    if (!isBrowser) {
      return;
    }

    // Подписываемся на изменения состояния аутентификации
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Получаем профиль пользователя из Firestore
        const userProfile = await getUserProfile(firebaseUser.uid)
        setProfile(userProfile)

        // Проверяем имя пользователя на соответствие требованиям
        if (userProfile && userProfile.username) {
          const usernameError = validateUsername(userProfile.username);
          if (usernameError) {
            setNeedsProfileUpdate(true);
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
  }, [router])

  const signIn = async (email: string, password: string) => {
    const { user, error } = await firebaseSignIn(email, password)
    return { error }
  }

  const signUp = async (email: string, password: string, username: string, role: string = "student") => {
    // Всегда используем роль student независимо от переданного значения
    const { user, error } = await firebaseSignUp(email, password, username, "student")
    return { error }
  }

  const signInWithGoogle = async () => {
    const { user, error } = await firebaseSignInWithGoogle()
    return { error }
  }

  const signInWithGithub = async () => {
    const { user, error } = await firebaseSignInWithGithub()
    return { error }
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
    <AuthContext.Provider value={{ user, profile, isLoading, signIn, signUp, signInWithGoogle, signInWithGithub, updateProfile, signOut }}>
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
