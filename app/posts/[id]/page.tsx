'use client'

import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { CommentsList } from "@/components/comments-list"
import { CommentForm } from "@/components/comment-form"
import { MessageSquare, ThumbsUp, Eye, Share2, Bookmark, Pencil, Archive, ArchiveRestore } from "lucide-react"
import { MarkdownContent } from "@/components/ui/markdown-content"
import { useEffect, useState } from 'react'
import React, { use } from 'react'
import { getPostById, recordView, likePost, hasUserLikedPost, toggleBookmark, hasUserBookmarkedPost, archivePost, unarchivePost } from '@/lib/client-api'
import { DeletePostButton } from "@/components/delete-post-button"
import { Post } from '@/types/database'
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const truncateString = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

const processHtmlContent = (content: string) => {
  return content.replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
    const displayText = text.length > 60 ? truncateString(text, 60) : text;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="post-link">${displayText}</a>`;
  });
};

const processBase64Images = (content: string) => {
  if (content.includes('data:image/')) {
    console.log('Post content contains base64 images');
  }
  return content;
};

type Props = {
  params: { id: string }
}

export default function PostPage({ params }: Props) {
  const unwrappedParams = use(params);
  const postId = unwrappedParams.id

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const canEdit = post && profile && (
    profile.role === "teacher" ||
    profile.role === "admin" ||
    post.author?.username === profile.username
  )

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostById(postId)

        if (postData && postData.content) {
          processBase64Images(postData.content);
        }

        setPost(postData)

        if (postData) {
          setIsArchived(!!postData.archived)
        }

        if (user) {
          await recordView(postId, user.uid)
        }
      } catch (error) {
        console.error('Ошибка при загрузке публикации:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId, user])

  useEffect(() => {
    const checkIfLiked = async () => {
      if (user && postId) {
        try {
          const liked = await hasUserLikedPost(postId, user.uid)
          setIsLiked(liked)
        } catch (error) {
          console.error('Ошибка при проверке лайка:', error)
        }
      }
    }

    checkIfLiked()
  }, [postId, user])

  useEffect(() => {
    const checkIfBookmarked = async () => {
      if (user && postId) {
        try {
          const bookmarked = await hasUserBookmarkedPost(postId, user.uid)
          setIsBookmarked(bookmarked)
        } catch (error) {
          console.error('Ошибка при проверке избранного:', error)
        }
      }
    }

    checkIfBookmarked()
  }, [postId, user])

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для отправки лайков",
        variant: "destructive"
      })
      return
    }

    try {
      const result = await likePost(postId, user.uid)

      const wasLiked = isLiked;

      setIsLiked(result)

      if (post) {
        let newLikesCount = post.likesCount || 0;

        if (result && !wasLiked) {
          newLikesCount += 1;
        } else if (!result && wasLiked) {
          newLikesCount = Math.max(0, newLikesCount - 1);
        }

        setPost({
          ...post,
          likesCount: newLikesCount
        })
      }
    } catch (error) {
      console.error('Ошибка при лайке/анлайке:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось обработать лайк",
        variant: "destructive"
      })
    }
  }

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для добавления в избранное",
        variant: "destructive"
      })
      return
    }

    try {
      const result = await toggleBookmark(postId, user.uid)
      setIsBookmarked(result)

      toast({
        title: result ? "Добавлено в избранное" : "Удалено из избранного",
        description: result ? "Публикация добавлена в избранное" : "Публикация удалена из избранного",
      })
    } catch (error) {
      console.error('Ошибка при добавлении/удалении из избранного:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось обработать действие",
        variant: "destructive"
      })
    }
  }

  const handleArchive = async () => {
    if (!user || !profile || (profile.role !== "teacher" && profile.role !== "admin")) {
      toast({
        title: "Ошибка",
        description: "У вас нет прав для архивирования публикаций",
        variant: "destructive"
      })
      return
    }

    setIsArchiving(true)

    try {
      const success = await archivePost(postId)

      if (success) {
        setIsArchived(true)

        if (post) {
          setPost({
            ...post,
            archived: true
          })
        }

        toast({
          title: "Публикация архивирована",
          description: "Публикация успешно перемещена в архив"
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось архивировать публикацию",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка при архивировании публикации:', error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при архивировании публикации",
        variant: "destructive"
      })
    } finally {
      setIsArchiving(false)
    }
  }



  const handleUnarchive = async () => {
    if (!user || !profile || (profile.role !== "teacher" && profile.role !== "admin")) {
      toast({
        title: "Ошибка",
        description: "У вас нет прав для восстановления публикаций из архива",
        variant: "destructive"
      })
      return
    }

    setIsArchiving(true)

    try {
      const success = await unarchivePost(postId)

      if (success) {
        setIsArchived(false)

        if (post) {
          setPost({
            ...post,
            archived: false
          })
        }

        toast({
          title: "Публикация восстановлена",
          description: "Публикация успешно восстановлена из архива"
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось восстановить публикацию из архива",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка при восстановлении публикации из архива:', error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при восстановлении публикации из архива",
        variant: "destructive"
      })
    } finally {
      setIsArchiving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="flex h-16 items-center px-4 sm:px-6">
            <MainNav />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto w-full">
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">Загрузка публикации...</p>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="flex h-16 items-center px-4 sm:px-6">
            <MainNav />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto w-full">
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">Публикация не найдена</p>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full">
          <Card className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <SimpleAvatar username={post.author?.username} size="lg" />
                  <div>
                    <div className="font-medium">{post.author?.username}</div>
                    <div className="flex items-center">
                      <Badge variant="outline">{post.author?.role === "teacher" ? "Учитель" : "Ученик"}</Badge>
                      <span className="text-sm text-muted-foreground ml-2">
                        {new Date(post.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-[hsl(var(--saas-purple))] hover:text-[hsl(var(--saas-purple-dark))] hover:bg-[hsl(var(--saas-purple)/0.1)]"
                      onClick={() => router.push(`/edit/${post.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                      Редактировать
                    </Button>
                  )}

                  {profile && (profile.role === "teacher" || profile.role === "admin") && (
                    <DeletePostButton
                      postId={post.id}
                      variant="outline"
                      size="sm"
                      showIcon={true}
                      showText={true}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    />
                  )}

                  {profile && (profile.role === "teacher" || profile.role === "admin") && (
                    isArchived ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                            Восстановить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Восстановить публикацию из архива?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Публикация будет восстановлена и станет доступна всем пользователям.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleUnarchive}
                              disabled={isArchiving}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isArchiving ? "Восстановление..." : "Восстановить"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Archive className="h-4 w-4" />
                            В архив
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Архивировать публикацию?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Публикация будет перемещена в архив и станет недоступна для обычных пользователей.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleArchive}
                              disabled={isArchiving}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              {isArchiving ? "Архивирование..." : "Архивировать"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBookmark}
                    className={isBookmarked ? 'text-[hsl(var(--saas-purple))]' : ''}
                  >
                    <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="markdown-content">
                <MarkdownContent
                  content={post.content}
                  className="post-markdown-content"
                />
              </div>

              <style jsx global>{`
                .post-markdown-content img {
                  display: block;
                  max-width: 100%;
                  height: auto;
                  margin: 1rem 0;
                  border-radius: 0.375rem;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }

                .post-markdown-content .base64-image {
                  display: block !important;
                  max-width: 100% !important;
                  height: auto !important;
                }
              `}</style>

              <div className="flex items-center space-x-6 mt-6">
                <Button
                  variant="outline"
                  className={`flex items-center gap-1 ${isLiked ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700' : ''}`}
                  onClick={handleLike}
                >
                  <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{post.likesCount || 0}</span>
                </Button>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentsCount || 0} комментариев</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewsCount || 0} просмотров</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <CommentsList postId={postId} />
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
