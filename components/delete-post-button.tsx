"use client"

import { deletePostAction } from "@/app/actions/delete-post"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getAuth } from "firebase/auth"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface DeletePostButtonProps {
  postId: string
  onSuccess?: () => void
  className?: string
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  showText?: boolean
}

export function DeletePostButton({
  postId,
  onSuccess,
  className = "",
  variant = "ghost",
  size = "icon",
  showIcon = true,
  showText = false,
}: DeletePostButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Получаем текущего пользователя
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для удаления публикаций",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)

    try {
      // Вызываем серверное действие для удаления публикации
      const result = await deletePostAction(postId, currentUser.uid)

      if (result && result.success) {
        toast({
          title: "Успешно",
          description: "Публикация была удалена",
          variant: "default",
        })

        // Вызываем колбэк при успешном удалении
        if (onSuccess) {
          onSuccess()
        } else {
          // Если колбэк не предоставлен, перенаправляем на главную страницу
          router.push("/")
          // Обновляем страницу для отображения изменений
          router.refresh()
        }
      } else {
        toast({
          title: "Ошибка",
          description: result?.error || "Не удалось удалить публикацию",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Ошибка при удалении публикации:", error)

      // Показываем более подробную информацию об ошибке
      const errorMessage =
        error instanceof Error ? error.message : "Произошла неизвестная ошибка"

      toast({
        title: "Ошибка",
        description: `Произошла ошибка при удалении публикации: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${showText ? "" : "h-8 w-8"} ${variant === "ghost" ? "text-red-500 hover:text-red-700 hover:bg-red-50" : ""}`}
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {showIcon && <Trash2 className="h-4 w-4" />}
      {showText && (isDeleting ? "Удаление..." : "Удалить")}
    </Button>
  )
}
