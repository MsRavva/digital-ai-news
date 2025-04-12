"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User as FirebaseUser } from "firebase/auth"
import type { Profile } from "@/types/database"
import { signIn as firebaseSignIn, signUp as firebaseSignUp, signOut as firebaseSignOut, getUserProfile, subscribeToAuthChanges } from "@/lib/firebase-auth"

interface AuthContextType {
  user: FirebaseUser | null
  profile: Profile | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string, role: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Подписываемся на изменения состояния аутентификации
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Получаем профиль пользователя из Firestore
        const userProfile = await getUserProfile(firebaseUser.uid)
        setProfile(userProfile)
      } else {
        setProfile(null)
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

  const signUp = async (email: string, password: string, username: string, role: string) => {
    const { user, error } = await firebaseSignUp(email, password, username, role)
    return { error }
  }

  const signOut = async () => {
    await firebaseSignOut()
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signIn, signUp, signOut }}>
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
