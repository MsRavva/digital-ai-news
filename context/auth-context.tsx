"use client"

import type React from "react"

import { toast } from "sonner"
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
import { onIdTokenChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"

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
  const routerRef = useRef(router)
  const hasRefreshedRef = useRef(false)
  const checkRedirectResultCalledRef = useRef(false)
  const isSubscribedRef = useRef(false)

  // Обновляем ref при изменении router
  useEffect(() => {
    routerRef.current = router
  }, [router])

  // Проверка имени пользователя и перенаправление на страницу профиля при необходимости
  useEffect(() => {
    if (needsProfileUpdate && profile && !isLoading) {
      toast.info("Пожалуйста, обновите ваш профиль", {
        description: "Пожалуйста, введите корректные Имя и Фамилию",
      })
      router.push("/profile?update=username")
      setNeedsProfileUpdate(false)
    }
  }, [needsProfileUpdate, profile, isLoading, router])

  // Функция для обновления токена в cookie - используем useRef для стабильной ссылки
  const updateTokenInCookieRef = useRef(async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken()
      // Устанавливаем cookie через API route для безопасности (httpOnly)
      try {
        await fetch("/api/auth/set-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: idToken }),
        })
      } catch (apiError) {
        // Fallback на document.cookie если API недоступен
        console.warn("Failed to set token via API, using fallback:", apiError)
        document.cookie = `auth-token=${idToken}; path=/; max-age=3600; SameSite=Lax`
      }
    } catch (error) {
      console.error("Error getting ID token:", error)
    }
  })

  useEffect(() => {
    // Выполняем только на клиенте
    if (!isBrowser) {
      return
    }

    // Защита от повторных подписок
    if (isSubscribedRef.current) {
      return
    }
    isSubscribedRef.current = true

    // Проверяем результат редиректа после аутентификации
    const checkRedirectResult = async () => {
      // Не проверяем редирект если уже проверяли
      if (checkRedirectResultCalledRef.current) {
        return
      }

      // Не проверяем редирект на странице 404
      const currentPath = isBrowser ? window.location.pathname : ""
      if (currentPath.includes("not-found")) {
        return
      }

      checkRedirectResultCalledRef.current = true

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
              toast.info("Пожалуйста, обновите ваш профиль", {
                description: "Пожалуйста, введите корректные Имя и Фамилию",
              })
              routerRef.current.push("/profile?update=username")
            } else {
              // Если имя пользователя соответствует требованиям, перенаправляем на главную страницу
              routerRef.current.push("/")
            }
          } else {
            // Если профиля нет, перенаправляем на главную страницу
            routerRef.current.push("/")
          }
        }
      } catch (error) {
        console.error("Error checking redirect result:", error)
      }
    }

    // Проверяем результат редиректа только один раз при монтировании
    checkRedirectResult()

    // Подписываемся на изменения состояния аутентификации
    const unsubscribeAuth = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Обновляем токен в cookie
        await updateTokenInCookieRef.current(firebaseUser)

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
        // Удаляем cookie при выходе
        try {
          await fetch("/api/auth/set-token", {
            method: "DELETE",
          })
        } catch (apiError) {
          // Fallback на document.cookie если API недоступен
          console.warn("Failed to delete token via API, using fallback:", apiError)
          document.cookie = "auth-token=; path=/; max-age=0"
        }
        setProfile(null)
        setNeedsProfileUpdate(false)
      }

      setIsLoading(false)
    })

    // Подписываемся на обновление токена (срабатывает каждые ~55 минут)
    let unsubscribeToken: (() => void) | null = null
    if (isBrowser && auth) {
      try {
        unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // Обновляем токен в cookie при его обновлении
            await updateTokenInCookieRef.current(firebaseUser)
          }
        })
      } catch (error) {
        console.error("Error setting up token refresh listener:", error)
      }
    }

    return () => {
      isSubscribedRef.current = false
      unsubscribeAuth()
      if (unsubscribeToken) {
        unsubscribeToken()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // Сначала удаляем cookie
    try {
      await fetch("/api/auth/set-token", {
        method: "DELETE",
      })
    } catch (apiError) {
      // Fallback на document.cookie если API недоступен
      console.warn("Failed to delete token via API, using fallback:", apiError)
      document.cookie = "auth-token=; path=/; max-age=0; SameSite=Lax"
    }
    
    // Затем выходим из Firebase
    await firebaseSignOut()
    
    // Используем window.location для полного редиректа, чтобы серверный layout проверил отсутствие cookie
    // Это гарантирует, что сервер увидит удаленный cookie
    if (isBrowser) {
      window.location.href = "/login"
    } else {
      router.push("/login")
      router.refresh()
    }
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

