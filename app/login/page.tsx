"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Github } from "lucide-react"
import { AuthHeader } from "@/components/auth-header"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const { signIn, signInWithGoogle, signInWithGithub } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        toast({
          title: "Ошибка входа",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Успешный вход",
        description: "Вы успешно вошли в систему",
      })

      // Принудительно обновляем страницу для корректного отображения состояния аутентификации
      window.location.href = "/"
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла неизвестная ошибка",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)

    try {
      const { error } = await signInWithGoogle()

      if (error) {
        toast({
          title: "Ошибка входа через Google",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Успешный вход",
        description: "Вы успешно вошли в систему через Google",
      })

      // Принудительно обновляем страницу для корректного отображения состояния аутентификации
      window.location.href = "/"
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла неизвестная ошибка",
        variant: "destructive",
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    setIsGithubLoading(true)

    try {
      const { error } = await signInWithGithub()

      if (error) {
        toast({
          title: "Ошибка входа через GitHub",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Успешный вход",
        description: "Вы успешно вошли в систему через GitHub",
      })

      // Принудительно обновляем страницу для корректного отображения состояния аутентификации
      window.location.href = "/"
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла неизвестная ошибка",
        variant: "destructive",
      })
    } finally {
      setIsGithubLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AuthHeader />
      <div className="flex flex-1 items-center justify-center p-4">
      <div className="saas-window max-w-md w-full">
        <div className="saas-window-header">
          <div className="saas-window-dot saas-window-dot-red"></div>
          <div className="saas-window-dot saas-window-dot-yellow"></div>
          <div className="saas-window-dot saas-window-dot-green"></div>
          <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">AI News - Вход</div>
        </div>
        <Card className="border-0 shadow-none bg-white dark:bg-[#0e1012]">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">Вход в AI News</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm text-gray-600 dark:text-gray-400">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1b23] rounded-md h-11 focus:border-saas-purple focus:ring-saas-purple text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm text-gray-600 dark:text-gray-400">Пароль</Label>
                  <Link href="/forgot-password" className="text-xs text-gray-500 dark:text-gray-400 hover:text-saas-purple">
                    Забыли пароль?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1b23] rounded-md h-11 focus:border-saas-purple focus:ring-saas-purple pr-10 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                className="w-full"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Вход..." : "Войти с Email"}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t-2 border-[hsl(var(--saas-purple)/0.3)] dark:border-gray-700"></span>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-[#0e1012] px-2 text-gray-500">
                    или продолжить через
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGithubSignIn}
                disabled={isGithubLoading}
                className="flex items-center justify-center gap-2 bg-transparent border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-11 rounded-md"
              >
                <Github className="h-4 w-4" />
                Продолжить с GitHub
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="flex items-center justify-center gap-2 bg-transparent border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 h-11 rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-0.5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Продолжить с Google
              </Button>

              <div className="text-center text-sm mt-4 text-gray-400">
                Нет аккаунта?{" "}
                <Link href="/register" className="text-gray-400 hover:text-saas-purple">
                  Зарегистрироваться
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
      </div>
    </div>
  )
}
