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
import { useAuth } from "@/context/auth-context"
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
  })
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Загрузка данных профиля при монтировании компонента
  useEffect(() => {
    if (profile) {
      const username = profile.username || ""
      setFormData({
        username,
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

  // Проверка валидации имени пользователя при изменении
  useEffect(() => {
    if (formData.username === "") return

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
  }, [formData.username])

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

    const usernameError = validateUsername(formData.username)
    if (usernameError) {
      setValidationErrors((prev) => ({ ...prev, username: usernameError }))
      toast.error("Ошибка валидации", {
        description: usernameError,
      })
      return
    }

    setIsSubmitting(true)

    try {
      const updatedProfile = {
        username: formData.username,
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card>
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
              <p className="text-muted-foreground mt-2">{user.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

