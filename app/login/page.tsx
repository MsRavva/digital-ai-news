"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context-supabase"
import { getSupabaseErrorMessage } from "@/lib/supabase-error-handler"
import { Eye, EyeOff, Github } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { toast } from "sonner"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { signIn, signInWithGoogle, signInWithGithub, user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Редирект если уже авторизован
  // useEffect(() => {
  //   if (!authLoading && user) {
  //     const redirect = searchParams.get("redirect")
  //     router.push(redirect || "/")
  //   }
  // }, [user, authLoading, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        console.error("Login error:", error)
        const errorMessage = getSupabaseErrorMessage(error)
        setFormError(errorMessage)
        setIsLoading(false)
        return
      }

      toast.success("Успешный вход", {
        description: "Вы успешно вошли в систему",
      })

      const redirect = searchParams.get("redirect")
      router.push(redirect && redirect.startsWith("/") ? redirect : "/")
    } catch (error) {
      console.error("Unexpected login error:", error)
      const errorMessage = getSupabaseErrorMessage(error as any)
      setFormError(errorMessage)
      setIsLoading(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setFormError(null)
    setIsGoogleLoading(true)

    try {
      const { error } = await signInWithGoogle()

      if (error) {
        console.error("Google sign in error:", error)
        const errorMessage = getSupabaseErrorMessage(error)
        setFormError(errorMessage)
        setIsGoogleLoading(false)
        return
      }

      // OAuth редиректит на callback, который обработает вход
      // Toast и редирект будут в callback
    } catch (error) {
      console.error("Unexpected Google sign in error:", error)
      const errorMessage = getSupabaseErrorMessage(error as any)
      setFormError(errorMessage)
      setIsGoogleLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    setFormError(null)
    setIsGithubLoading(true)

    try {
      const { error } = await signInWithGithub()

      if (error) {
        console.error("GitHub sign in error:", error)
        const errorMessage = getSupabaseErrorMessage(error)
        setFormError(errorMessage)
        setIsGithubLoading(false)
        return
      }

      // OAuth редиректит на callback, который обработает вход
      // Toast и редирект будут в callback
    } catch (error) {
      console.error("Unexpected GitHub sign in error:", error)
      const errorMessage = getSupabaseErrorMessage(error as any)
      setFormError(errorMessage)
      setIsGithubLoading(false)
    }
  }

  // Показываем загрузку пока проверяем аутентификацию
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  // Не скрываем форму для авторизованных пользователей
  // if (user) {
  //   return null
  // }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Вход в AI News
            </CardTitle>
            <CardDescription className="text-center">
              Войдите в свой аккаунт для продолжения
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {formError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email">Email</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Забыли пароль?
                  </Link>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Вход..." : "Войти с Email"}
              </Button>

              <div className="relative my-2 w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    или продолжить через
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGithubSignIn}
                disabled={isGithubLoading}
                className="w-full"
              >
                <Github className="mr-2 h-4 w-4" />
                {isGithubLoading ? "Вход..." : "Продолжить с GitHub"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-2"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {isGoogleLoading ? "Вход..." : "Продолжить с Google"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Нет аккаунта?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:underline"
                >
                  Зарегистрироваться
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

