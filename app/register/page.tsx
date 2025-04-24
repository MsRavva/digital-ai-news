"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Удалены неиспользуемые компоненты RadioGroup
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { validateUsername } from "@/lib/validation"
import { getFirebaseErrorMessage } from "@/lib/firebase-error-handler"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Github } from "lucide-react"
import { AuthHeader } from "@/components/auth-header"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  // Роль всегда student
  const role = "student"
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null) // Состояние для отображения ошибки формы
  const { signUp, signInWithGoogle, signInWithGithub } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Проверка имени пользователя при вводе
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);

    // Пропускаем валидацию для пустого значения
    if (!value.trim()) {
      setUsernameError(null);
      return;
    }

    // Проверяем имя пользователя
    const error = validateUsername(value);
    setUsernameError(error);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted", { email, username, password })

    // Сбрасываем предыдущую ошибку
    setFormError(null)

    if (password !== confirmPassword) {
      setFormError("Пароли не совпадают")
      return
    }

    // Проверка имени пользователя
    const usernameError = validateUsername(username);
    if (usernameError) {
      setFormError(usernameError)
      return
    }

    setIsLoading(true)
    console.log("Starting registration process")

    try {
      console.log("Calling signUp function")
      const { error } = await signUp(email, password, username, role)
      console.log("signUp function returned", { error })

      if (error) {
        console.error("Registration error:", error)
        console.error("Error type:", typeof error)
        console.error("Error code:", error.code)
        console.error("Error message:", error.message)

        // Получаем понятное сообщение об ошибке
        const errorMessage = getFirebaseErrorMessage(error)
        console.log("Translated error message:", errorMessage)

        // Устанавливаем сообщение об ошибке в состояние формы
        setFormError(errorMessage)

        // Устанавливаем isLoading в false
        setIsLoading(false)
        return
      }

      console.log("Registration successful")
      toast({
        title: "Успешная регистрация",
        description: "Вы успешно зарегистрировались",
      })

      // Перенаправляем на главную страницу
      console.log("Redirecting to home page")
      router.push("/")
    } catch (error) {
      console.error("Unexpected error during registration:", error)

      // Получаем понятное сообщение об ошибке
      const errorMessage = getFirebaseErrorMessage(error)

      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)

    try {
      const { error, user, profile } = await signInWithGoogle()

      if (error) {
        console.error("Google sign in error:", error)

        // Получаем понятное сообщение об ошибке
        const errorMessage = getFirebaseErrorMessage(error)
        console.log("Translated Google error message:", errorMessage)

        // Устанавливаем сообщение об ошибке в состояние формы
        setFormError(errorMessage)

        // Устанавливаем isGoogleLoading в false
        setIsGoogleLoading(false)
        return
      }

      toast({
        title: "Успешный вход",
        description: "Вы успешно вошли в систему через Google",
      })

      // Проверяем имя пользователя на соответствие требованиям
      if (profile && profile.username) {
        const { validateUsername } = await import('@/lib/validation');
        const usernameError = validateUsername(profile.username);
        if (usernameError) {
          // Если имя пользователя не соответствует требованиям, перенаправляем на страницу профиля
          toast({
            title: "Пожалуйста, обновите ваш профиль",
            description: "Пожалуйста, введите корректные Имя и Фамилию",
            duration: 5000,
          })
          router.push('/profile?update=username');
          return;
        }
      }

      // Перенаправляем на главную страницу
      router.push("/")
    } catch (error) {
      console.error("Unexpected Google sign in error:", error)

      // Получаем понятное сообщение об ошибке
      const errorMessage = getFirebaseErrorMessage(error)
      console.log("Translated unexpected Google error:", errorMessage)

      // Устанавливаем сообщение об ошибке в состояние формы
      setFormError(errorMessage)

      // Устанавливаем isGoogleLoading в false
      setIsGoogleLoading(false)
    } finally {
      // Убедимся, что isGoogleLoading установлен в false
      setIsGoogleLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    setIsGithubLoading(true)

    try {
      const { error, user, profile } = await signInWithGithub()

      if (error) {
        console.error("GitHub sign in error:", error)

        // Получаем понятное сообщение об ошибке
        const errorMessage = getFirebaseErrorMessage(error)
        console.log("Translated GitHub error message:", errorMessage)

        // Устанавливаем сообщение об ошибке в состояние формы
        setFormError(errorMessage)

        // Устанавливаем isGithubLoading в false
        setIsGithubLoading(false)
        return
      }

      toast({
        title: "Успешный вход",
        description: "Вы успешно вошли в систему через GitHub",
      })

      // Проверяем имя пользователя на соответствие требованиям
      if (profile && profile.username) {
        const { validateUsername } = await import('@/lib/validation');
        const usernameError = validateUsername(profile.username);
        if (usernameError) {
          // Если имя пользователя не соответствует требованиям, перенаправляем на страницу профиля
          toast({
            title: "Пожалуйста, обновите ваш профиль",
            description: "Пожалуйста, введите корректные Имя и Фамилию",
            duration: 5000,
          })
          router.push('/profile?update=username');
          return;
        }
      }

      // Перенаправляем на главную страницу
      router.push("/")
    } catch (error) {
      console.error("Unexpected GitHub sign in error:", error)

      // Получаем понятное сообщение об ошибке
      const errorMessage = getFirebaseErrorMessage(error)
      console.log("Translated unexpected GitHub error:", errorMessage)

      // Устанавливаем сообщение об ошибке в состояние формы
      setFormError(errorMessage)

      // Устанавливаем isGithubLoading в false
      setIsGithubLoading(false)
    } finally {
      // Убедимся, что isGithubLoading установлен в false
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
          <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">AI News - Регистрация</div>
        </div>
        <Card className="border-0 shadow-none bg-white dark:bg-[#0e1012]">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">Регистрация в AI News</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Отображение ошибки формы */}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {formError}
                </div>
              )}

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
                <Label htmlFor="username" className="text-sm text-gray-600 dark:text-gray-400">Имя пользователя</Label>
                <Input
                  id="username"
                  placeholder="Имя Фамилия"
                  value={username}
                  onChange={handleUsernameChange}
                  required
                  className={`border ${usernameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-saas-purple focus:ring-saas-purple'} bg-white dark:bg-[#1a1b23] rounded-md h-11 text-gray-900 dark:text-white`}
                />
                {usernameError ? (
                  <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Укажите имя и фамилию на русском языке, например: Иван Иванов</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm text-gray-600 dark:text-gray-400">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Создайте пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1b23] rounded-md h-11 focus:border-saas-purple focus:ring-saas-purple text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-password" className="text-sm text-gray-600 dark:text-gray-400">Подтверждение пароля</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Подтвердите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1b23] rounded-md h-11 focus:border-saas-purple focus:ring-saas-purple text-gray-900 dark:text-white"
                />
              </div>
              {/* Блок выбора роли удален, всем пользователям присваивается роль student */}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                className="w-full"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Регистрация..." : "Зарегистрироваться"}
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
                Уже есть аккаунт?{" "}
                <Link href="/login" className="text-gray-400 hover:text-saas-purple">
                  Войти
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
