"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { addComment } from "@/lib/firebase-db"
import { useToast } from "@/components/ui/use-toast"

interface CommentFormProps {
  postId: string
  parentId?: string
  onCommentAdded?: () => void
  onCancel?: () => void
  placeholder?: string
}

export function CommentForm({
  postId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = "Напишите комментарий..."
}: CommentFormProps) {
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для отправки комментариев",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)

      const commentData = {
        content: comment,
        post_id: postId,
        author_id: user.uid,
        parent_id: parentId
      }

      const commentId = await addComment(commentData)

      if (commentId) {
        setComment("")
        toast({
          title: "Успех",
          description: "Комментарий успешно добавлен"
        })

        if (onCommentAdded) {
          onCommentAdded()
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось добавить комментарий",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        placeholder={placeholder}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[100px] mb-2"
        disabled={isSubmitting}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
        )}
        <Button
          type="submit"
          disabled={!comment.trim() || isSubmitting}
        >
          {isSubmitting ? "Отправка..." : "Отправить"}
        </Button>
      </div>
    </form>
  )
}
