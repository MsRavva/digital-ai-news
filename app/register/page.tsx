"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Github } from "lucide-react"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [role, setRole] = useState("student")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const { signUp, signInWithGoogle, signInWithGithub } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signUp(email, password, username, role)

      if (error) {
        toast({
          title: "Ошибка регистрации",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Успешная регистрация",
        description: "Вы успешно зарегистрировались",
      })

      router.push("/")
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

      router.push("/")
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

      router.push("/")
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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт для доступа к AI News</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                placeholder="Введите имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Создайте пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Подтверждение пароля</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Подтвердите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <RadioGroup value={role} onValueChange={setRole}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student">Ученик</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="teacher" />
                  <Label htmlFor="teacher">Учитель</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 dark:bg-[#111827] dark:text-gray-400">
                  Или войти через
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chrome">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="21.17" x1="8" y1="8" y2="21.17"/>
                  <line x1="3.95" x1="6.06" y1="6.06" y2="3.95"/>
                  <line x1="10.88" x1="21.17" y1="10.88" y2="3.95"/>
                  <line x1="3.95" x1="21.17" y1="3.95" y2="16"/>
                </svg>
                Google
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleGithubSignIn}
                disabled={isGithubLoading}
                className="flex items-center justify-center gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </Button>
            </div>

            <div className="text-center text-sm mt-4">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Войти
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
