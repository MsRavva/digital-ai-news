"use client"

import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThumbsUp, Reply } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getCommentsByPostId, likeComment, unlikeComment } from "@/lib/firebase-db"
import { CommentForm } from "./comment-form"
import { useToast } from "@/components/ui/use-toast"
import type { Comment } from "@/types/database"

interface CommentsListProps {
  postId: string
}

export function CommentsList({ postId }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const fetchComments = async () => {
    try {
      setLoading(true)
      const fetchedComments = await getCommentsByPostId(postId)
      setComments(fetchedComments)
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить комментарии",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postId])

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для отправки лайков",
        variant: "destructive"
      })
      return
    }

    try {
      const isLiked = likedComments.has(commentId)

      if (isLiked) {
        await unlikeComment(commentId, user.uid)
        setLikedComments(prev => {
          const newSet = new Set(prev)
          newSet.delete(commentId)
          return newSet
        })
      } else {
        await likeComment(commentId, user.uid)
        setLikedComments(prev => new Set([...prev, commentId]))
      }

      // Обновляем комментарии после лайка/анлайка
      fetchComments()
    } catch (error) {
      console.error("Error liking/unliking comment:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обработать лайк",
        variant: "destructive"
      })
    }
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "ml-12 mt-4" : "mb-6"}`}>
      <div className="flex items-start gap-4">
        <SimpleAvatar username={comment.author.username} size="md" />
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-medium">{comment.author.username}</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {comment.author.role === "teacher" ? "Учитель" : "Ученик"}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              {new Date(comment.created_at).toLocaleDateString("ru-RU")}
            </span>
          </div>
          <p className="mt-1">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 ${likedComments.has(comment.id) ? 'text-[hsl(var(--saas-purple))]' : ''}`}
              onClick={() => handleLike(comment.id)}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              <span className="text-xs">{comment.likesCount || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              <span className="text-xs">Ответить</span>
            </Button>
          </div>

          {replyingTo === comment.id && (
            <div className="mt-4">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onCommentAdded={() => {
                  setReplyingTo(null)
                  fetchComments()
                }}
                onCancel={() => setReplyingTo(null)}
                placeholder="Напишите ответ..."
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => renderComment(reply, true))}
    </div>
  )

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Загрузка комментариев...</div>
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Комментарии</h3>
        <CommentForm postId={postId} onCommentAdded={fetchComments} />
      </div>

      {comments.length > 0 ? (
        <div>{comments.map((comment) => renderComment(comment))}</div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          Комментариев пока нет. Будьте первым, кто оставит комментарий!
        </div>
      )}
    </div>
  )
}
