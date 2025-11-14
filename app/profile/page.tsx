"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SimpleAvatar } from "@/components/simple-avatar"
import { HeroHeader } from "@/components/header"
import { useAuth } from "@/context/auth-context-supabase"
import { validateUsername } from "@/lib/validation"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, profile, updateProfile, isLoading } = useAuth()
  const searchParams = useSearchParams()
  const updateParam = searchParams.get("update")
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  })
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Загрузка данных профиля при монтировании компонента
  useEffect(() => {
    if (profile) {
      const username = profile.username || ""
      const email = profile.email || ""
      setFormData({
        username,
        email,
      })
    }
  }, [profile])

  // Обработка параметра запроса update=username
  useEffect(() => {
    if (updateParam === "username" && profile) {
      setTimeout(() => {
        const usernameInput = document.getElementById("username")
        if (usernameInput) {
          usernameInput.focus()
          usernameInput.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 500)
    }
  }, [searchParams, profile])

  // Проверка валидации имени пользователя и email при изменении
  useEffect(() => {
    if (formData.username !== "") {
      const error = validateUsername(formData.username)
      if (error) {
        setValidationErrors((prev) => ({ ...prev, username: error }))
      } else {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.username
          return newErrors
        })
      }
    }

    if (formData.email !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setValidationErrors((prev) => ({ ...prev, email: "Неверный формат email" }))
      } else {
        setValidationErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors.email
          return newErrors
        })
      }
    }
  }, [formData.username, formData.email])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !profile) return

    // Валидация имени
    const usernameError = validateUsername(formData.username)
    if (usernameError) {
      setValidationErrors((prev) => ({ ...prev, username: usernameError }))
      toast.error("Ошибка валидации", {
        description: usernameError,
      })
      return
    }

    // Валидация email
    if (!formData.email.trim()) {
      setValidationErrors((prev) => ({ ...prev, email: "Email обязателен" }))
      toast.error("Ошибка валидации", {
        description: "Email обязателен",
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setValidationErrors((prev) => ({ ...prev, email: "Неверный формат email" }))
      toast.error("Ошибка валидации", {
        description: "Неверный формат email",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const updatedProfile = {
        username: formData.username,
        email: formData.email,
      }

      const { success, error } = await updateProfile(updatedProfile)

      if (success) {
        toast.success("Профиль обновлен", {
          description: "Ваш профиль был успешно обновлен",
        })

        if (updateParam) {
          window.history.replaceState({}, "", "/profile")
        }
      } else {
        toast.error("Ошибка", {
          description: error?.message || "Не удалось обновить профиль",
        })
      }
    } catch (error: any) {
      toast.error("Ошибка", {
        description: error.message || "Произошла ошибка при обновлении профиля",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <HeroHeader />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <div className="text-muted-foreground">Загрузка...</div>
        </div>
      </>
    )
  }

  if (!user || !profile) {
    return (
      <>
        <HeroHeader />
        <div className="flex min-h-screen items-center justify-center pt-24">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Требуется авторизация</CardTitle>
              <CardDescription>
                Пожалуйста, войдите в систему для просмотра профиля
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href="/login">Войти</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <HeroHeader />
      <div className="container mx-auto w-[90%] pt-24 pb-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Профиль пользователя</CardTitle>
            <CardDescription>
              Управляйте информацией вашего профиля
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6">
              <SimpleAvatar
                username={profile.username}
                size="xl"
                className="h-24 w-24"
              />
              <div className="text-center">
                <h2 className="text-2xl font-bold">{profile.username}</h2>
                <Badge variant="outline" className="mt-2">
                  {profile.role === "teacher"
                    ? "Учитель"
                    : profile.role === "admin"
                      ? "Администратор"
                      : "Ученик"}
                </Badge>
                <p className="text-muted-foreground mt-2">{profile.email || user.email}</p>
              </div>

              <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Имя пользователя *</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={
                      validationErrors.username || updateParam === "username"
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                    placeholder="Иван Иванов"
                    required
                  />
                  {validationErrors.username && (
                    <p className="text-sm text-destructive">
                      {validationErrors.username}
                    </p>
                  )}
                  {updateParam === "username" && !validationErrors.username && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Пожалуйста, введите корректные Имя и Фамилию на русском
                      языке
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Укажите имя и фамилию на русском языке, например: Иван Иванов
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={
                      validationErrors.email || (!formData.email && updateParam)
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                    placeholder="example@example.com"
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-destructive">
                      {validationErrors.email}
                    </p>
                  )}
                  {!formData.email && updateParam && !validationErrors.email && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Пожалуйста, укажите ваш email
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Email будет использоваться для восстановления доступа
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

