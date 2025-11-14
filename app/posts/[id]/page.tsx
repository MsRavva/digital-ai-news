"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { HeroHeader } from "@/components/header"
import { SimpleAvatar } from "@/components/simple-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MarkdownContent } from "@/components/ui/markdown-content"
import { MessageSquare, ThumbsUp, Eye, Pencil, Trash2 } from "lucide-react"
import { getPostById, recordView } from "@/lib/supabase-posts-api"
import { likePost, hasUserLikedPost, deletePost } from "@/lib/supabase-post-actions"
import { useAuth } from "@/context/auth-context-supabase"
import { toast } from "sonner"
import type { Post } from "@/types/database"
import { Spinner } from "@/components/ui/spinner"
import { CommentsList } from "@/components/comments-list"
import { cn } from "@/lib/utils"
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

type Props = {
  params: Promise<{ id: string }>
}

export default function PostPage({ params }: Props) {
  const unwrappedParams = use(params)
  const postId = unwrappedParams.id

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { user, profile, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Вычисляем права доступа с использованием useMemo для пересчета при изменении post или profile
  const canEdit = !authLoading && post && profile && (
    profile.role === "teacher" ||
    profile.role === "admin" ||
    post.author?.username === profile.username
  )

  const canDelete = !authLoading && post && profile && (profile.role === "admin" || profile.role === "teacher")

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostById(postId)

        if (!postData) {
          toast.error("Публикация не найдена")
          router.push("/")
          return
        }

        setPost(postData)

        if (user) {
          await recordView(postId, user.id)
          
          // Проверяем, лайкнул ли пользователь пост
          const liked = await hasUserLikedPost(postId, user.id)
          setIsLiked(liked)
        }
      } catch (error) {
        console.error("Ошибка при загрузке публикации:", error)
        toast.error("Ошибка при загрузке публикации")
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId, user, router])

  const handleLike = async () => {
    if (!user) {
      toast.error("Вы должны быть авторизованы для отправки лайков")
      return
    }

    try {
      const result = await likePost(postId, user.id)

      const wasLiked = isLiked
      setIsLiked(result)

      if (post) {
        let newLikesCount = post.likesCount || 0

        if (result && !wasLiked) {
          newLikesCount += 1
        } else if (!result && wasLiked) {
          newLikesCount = Math.max(0, newLikesCount - 1)
        }

        setPost({
          ...post,
          likesCount: newLikesCount
        })
      }
    } catch (error) {
      console.error('Ошибка при лайке/анлайке:', error)
      toast.error("Не удалось обработать лайк")
    }
  }

  const handleDelete = async () => {
    if (!post) return

    setIsDeleting(true)

    try {
      const success = await deletePost(post.id)
      if (success) {
        toast.success("Публикация удалена")
        router.push("/")
      } else {
        toast.error("Не удалось удалить публикацию")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("Произошла ошибка")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <>
        <HeroHeader />
        <div className="container mx-auto w-[90%] pt-24 pb-8 px-4">
          <Card className={cn(
        "rounded-3xl border-border/50 dark:border-white/[0.1] transition-all duration-300",
        "shadow-[0_2px_15px_rgba(0,0,0,0.08),0_8px_25px_rgba(0,0,0,0.05)]",
        "dark:shadow-[0_2px_20px_rgba(98,51,255,0.12),0_8px_35px_rgba(98,51,255,0.08),0_0_0_1px_rgba(255,255,255,0.03)]"
      )}>
            <CardContent className="flex justify-center items-center h-40">
              <div className="flex items-center gap-2">
                <Spinner className="h-5 w-5" />
                <span className="text-muted-foreground">Загрузка публикации...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!post) {
    return (
      <>
        <HeroHeader />
        <div className="container mx-auto w-[90%] pt-24 pb-8 px-4">
          <Card className={cn(
        "rounded-3xl border-border/50 dark:border-white/[0.1] transition-all duration-300",
        "shadow-[0_2px_15px_rgba(0,0,0,0.08),0_8px_25px_rgba(0,0,0,0.05)]",
        "dark:shadow-[0_2px_20px_rgba(98,51,255,0.12),0_8px_35px_rgba(98,51,255,0.08),0_0_0_1px_rgba(255,255,255,0.03)]"
      )}>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Публикация не найдена</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление публикации</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить эту публикацию? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <HeroHeader />
      <div className="container mx-auto w-[90%] pt-24 pb-8 px-4">
      <Card className={cn(
        "rounded-3xl border-border/50 dark:border-white/[0.1] transition-all duration-300",
        "shadow-[0_2px_15px_rgba(0,0,0,0.08),0_8px_25px_rgba(0,0,0,0.05)]",
        "dark:shadow-[0_2px_20px_rgba(98,51,255,0.12),0_8px_35px_rgba(98,51,255,0.08),0_0_0_1px_rgba(255,255,255,0.03)]",
        "hover:shadow-[0_4px_25px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.08)]",
        "dark:hover:shadow-[0_4px_30px_rgba(98,51,255,0.18),0_12px_50px_rgba(98,51,255,0.12),0_0_0_1px_rgba(255,255,255,0.05)]"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SimpleAvatar username={post.author?.username} size="lg" />
              <div>
                <div className="font-medium">{post.author?.username}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {post.author?.role === "teacher"
                      ? "Учитель"
                      : post.author?.role === "admin"
                        ? "Администратор"
                        : "Ученик"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </div>
            </div>
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-2">
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                )}
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => router.push(`/edit/${post.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                    Редактировать
                  </Button>
                )}
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold mt-6">{post.title}</h1>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <MarkdownContent content={post.content} />
        </CardContent>

        <CardFooter>
          <div className="flex items-center space-x-6 w-full">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 ${isLiked ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20' : ''}`}
              onClick={handleLike}
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likesCount || 0}</span>
            </Button>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">{post.commentsCount || 0} комментариев</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{post.viewsCount || 0} просмотров</span>
            </div>
          </div>
        </CardFooter>

        <Separator className="my-6" />

        <CardContent>
          <CommentsList postId={post.id} />
        </CardContent>
      </Card>
      </div>
    </>
  )
}

