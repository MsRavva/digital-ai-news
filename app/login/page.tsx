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
import { Eye, EyeOff } from "lucide-react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="saas-window max-w-md w-full">
        <div className="saas-window-header">
          <div className="saas-window-dot saas-window-dot-red"></div>
          <div className="saas-window-dot saas-window-dot-yellow"></div>
          <div className="saas-window-dot saas-window-dot-green"></div>
          <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">AI News - Вход</div>
        </div>
        <Card className="border-0 shadow-none dark:bg-[#111827]">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Link href="/" className="font-bold text-2xl flex items-center">
                <span className="text-saas-purple mr-1">AI</span>News
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Вход в систему</CardTitle>
            <CardDescription className="text-center">Введите свои учетные данные для входа в AI News</CardDescription>
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
                  className="border-gray-200 focus:border-saas-purple focus:ring-saas-purple dark:border-[#374151] dark:bg-[#1e293b]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Пароль</Label>
                  <Link href="/forgot-password" className="text-xs text-saas-purple hover:underline">
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
                    className="border-gray-200 focus:border-saas-purple focus:ring-saas-purple pr-10 dark:border-[#374151] dark:bg-[#1e293b]"
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
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" variant="saas" type="submit" disabled={isLoading}>
                {isLoading ? "Вход..." : "Войти"}
              </Button>
              <div className="text-center text-sm">
                Нет аккаунта?{" "}
                <Link href="/register" className="text-saas-purple hover:underline">
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
