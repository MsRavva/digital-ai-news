"use client"

import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThumbsUp, Reply, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { getCommentsByPostId, likeComment, unlikeComment } from "@/lib/firebase-db"
import { deleteComment } from "@/lib/client-api"
import { CommentForm } from "./comment-form"
import { useToast } from "@/components/ui/use-toast"
import type { Comment } from "@/types/database"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CommentsListProps {
  postId: string
}

export function CommentsList({ postId }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingComments, setDeletingComments] = useState<Set<string>>(new Set())
  const { user, profile } = useAuth()
  const { toast } = useToast()

  // Константы для анимации
  const animationDuration = 0.9 // в секундах

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

  // Проверка прав на удаление комментария
  const canDeleteComment = (comment: Comment) => {
    if (!user || !profile) return false

    // Автор комментария может удалить свой комментарий
    const isAuthor = comment.author.username === profile.username

    // Учитель или админ может удалить любой комментарий
    const isTeacherOrAdmin = profile.role === "teacher" || profile.role === "admin"

    return isAuthor || isTeacherOrAdmin
  }

  // Обработчик удаления комментария
  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId)
  }

  // Подтверждение удаления комментария
  const confirmDelete = async () => {
    if (!commentToDelete) return

    setIsDeleting(true)

    // Находим все дочерние комментарии для анимации
    const childComments = findAllChildComments(commentToDelete, comments)
    const allCommentsToAnimate = [commentToDelete, ...childComments]

    // Закрываем диалог подтверждения
    setCommentToDelete(null)

    // Добавляем эффект дрожания перед удалением
    const applyShakeEffect = (commentId: string) => {
      const element = document.getElementById(`comment-${commentId}`);
      if (element) {
        element.style.animation = 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both';
      }
    };

    // Последовательно применяем эффект дрожания к каждому комментарию
    // Сначала родительский комментарий, затем дочерние
    setTimeout(() => applyShakeEffect(commentToDelete), 0);

    // Добавляем дочерние комментарии в список удаляемых с задержкой
    childComments.forEach((id, index) => {
      setTimeout(() => applyShakeEffect(id), 100 + index * 50);
    });

    // Плавно добавляем комментарии в список удаляемых
    // Сначала родительский комментарий
    setTimeout(() => {
      setDeletingComments(prev => {
        const newSet = new Set(prev)
        newSet.add(commentToDelete)
        return newSet
      })

      // Затем дочерние комментарии последовательно
      childComments.forEach((id, index) => {
        setTimeout(() => {
          setDeletingComments(prev => {
            const newSet = new Set(prev)
            newSet.add(id)
            return newSet
          })
        }, 100 + index * 50) // Последовательное добавление с задержкой
      })
    }, 400)

    // Ждем завершения анимации с небольшим запасом
    setTimeout(async () => {
      try {
        const success = await deleteComment(commentToDelete)

        if (success) {
          toast({
            title: "Успешно",
            description: "Комментарий был удален",
            variant: "default"
          })

          // Обновляем список комментариев
          fetchComments()
        } else {
          toast({
            title: "Ошибка",
            description: "Не удалось удалить комментарий",
            variant: "destructive"
          })

          // Убираем комментарии из списка удаляемых
          setDeletingComments(prev => {
            const newSet = new Set(prev)
            allCommentsToAnimate.forEach(id => newSet.delete(id))
            return newSet
          })
        }
      } catch (error) {
        console.error("Error deleting comment:", error)
        toast({
          title: "Ошибка",
          description: "Произошла ошибка при удалении комментария",
          variant: "destructive"
        })

        // Убираем комментарии из списка удаляемых
        setDeletingComments(prev => {
          const newSet = new Set(prev)
          allCommentsToAnimate.forEach(id => newSet.delete(id))
          return newSet
        })
      } finally {
        setIsDeleting(false)
      }
    }, (animationDuration + 0.3) * 1000) // Добавляем запас времени для завершения анимации
  }

  // Функция для поиска всех дочерних комментариев
  const findAllChildComments = (commentId: string, commentsList: Comment[]): string[] => {
    const childIds: string[] = []

    // Рекурсивная функция для поиска дочерних комментариев
    const findChildren = (parentId: string, comments: Comment[]) => {
      for (const comment of comments) {
        if (comment.parent_id === parentId) {
          childIds.push(comment.id)
          // Рекурсивно ищем дочерние комментарии для текущего комментария
          findChildren(comment.id, comments)
        }
        // Также проверяем вложенные ответы
        if (comment.replies && comment.replies.length > 0) {
          findChildren(parentId, comment.replies)
        }
      }
    }

    // Начинаем поиск с корневых комментариев
    findChildren(commentId, commentsList)

    return childIds
  }

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

  const renderComment = (comment: Comment, isReply = false) => {
    // Проверяем, находится ли комментарий в процессе удаления
    const isDeleting = deletingComments.has(comment.id)

    // Анимация для комментария
    const variants = {
      visible: {
        opacity: 1,
        y: 0,
        marginBottom: isReply ? 0 : 24,
        x: 0,
        backgroundColor: "transparent",
        boxShadow: "0 0 0px rgba(255, 0, 0, 0)",
        scale: 1,
        rotateX: 0,
        position: "relative",
        zIndex: 1
      },
      hidden: {
        opacity: 0,
        y: -20,
        marginBottom: isReply ? 0 : 24, // Сохраняем маржин для плавного скролла
        x: -10,
        backgroundColor: "rgba(255, 0, 0, 0.08)",
        boxShadow: "0 0 15px rgba(255, 0, 0, 0.5), inset 0 0 10px rgba(255, 0, 0, 0.2)",
        scale: 0.9,
        rotateX: -10,
        position: "relative",
        zIndex: 0
      }
    }

    return (
      <motion.div
        key={comment.id}
        id={`comment-${comment.id}`}
        className={`${isReply ? "ml-12 mt-4" : "mb-6"} rounded-lg p-3 transition-colors`}
        initial="visible"
        animate={isDeleting ? "hidden" : "visible"}
        exit="hidden"
        variants={variants}
        transition={{
          duration: animationDuration,
          ease: [0.25, 0.1, 0.25, 1], // Более выразительная кривая
          opacity: { duration: animationDuration * 0.8 },
          backgroundColor: { duration: animationDuration * 0.5, ease: "easeOut" },
          boxShadow: { duration: animationDuration * 0.6, ease: "easeOut" },
          x: { duration: animationDuration * 0.7, ease: "easeIn" },
          y: { duration: animationDuration * 0.8, ease: "easeInOut" }, // Плавное движение вверх
          scale: { duration: animationDuration, ease: "anticipate" },
          rotateX: { duration: animationDuration * 0.7, ease: "easeIn" },
          zIndex: { duration: 0 } // Мгновенное изменение z-index
        }}
      >
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
                disabled={isDeleting}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                <span className="text-xs">{comment.likesCount || 0}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                disabled={isDeleting}
              >
                <Reply className="h-3 w-3 mr-1" />
                <span className="text-xs">Ответить</span>
              </Button>
              {canDeleteComment(comment) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-100/10"
                  onClick={() => handleDeleteClick(comment.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  <span className="text-xs">Удалить</span>
                </Button>
              )}
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

        <div className="relative">
          <AnimatePresence>
            {comment.replies?.map((reply) => renderComment(reply, true))}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground">Загрузка комментариев...</div>
  }

  return (
    <>
      <AlertDialog open={commentToDelete !== null} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление комментария</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот комментарий? Все ответы на него также будут удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Комментарии</h3>
          <CommentForm postId={postId} onCommentAdded={fetchComments} />
        </div>

        <AnimatePresence mode="wait">
          {comments.length > 0 ? (
            <motion.div
              key="comments-list"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="comments-container relative">
                <AnimatePresence>
                  {comments.map((comment) => renderComment(comment))}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-comments"
              className="text-center py-4 text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: comments.length === 0 ? 0 : 0.3 // Задержка появления после удаления последнего комментария
              }}
            >
              Комментариев пока нет. Будьте первым, кто оставит комментарий!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
