"use client"

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { getArchivedPosts, unarchivePost } from "@/lib/client-api"
import { Post } from "@/types/database"
import Link from "next/link"
import { MessageSquare, ThumbsUp, Eye, Archive, ArchiveRestore } from "lucide-react"
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

export default function ArchivePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [postToRestore, setPostToRestore] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Проверка прав доступа
  useEffect(() => {
    if (!loading && profile && profile.role !== "teacher" && profile.role !== "admin") {
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав для просмотра архива",
        variant: "destructive"
      })
      router.push("/")
    }
  }, [profile, loading, router, toast])

  // Загрузка архивированных постов
  useEffect(() => {
    const fetchArchivedPosts = async () => {
      if (!user) return

      try {
        const archivedPosts = await getArchivedPosts()
        setPosts(archivedPosts)
      } catch (error) {
        console.error("Ошибка при загрузке архивированных постов:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить архивированные публикации",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchArchivedPosts()
  }, [user, toast])

  // Обработчик восстановления поста из архива
  const handleRestore = async () => {
    if (!postToRestore) return

    setIsRestoring(true)

    try {
      const success = await unarchivePost(postToRestore)

      if (success) {
        // Удаляем пост из списка архивированных
        setPosts(posts.filter(post => post.id !== postToRestore))
        
        toast({
          title: "Публикация восстановлена",
          description: "Публикация успешно восстановлена из архива"
        })
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось восстановить публикацию",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Ошибка при восстановлении публикации:", error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при восстановлении публикации",
        variant: "destructive"
      })
    } finally {
      setPostToRestore(null)
      setIsRestoring(false)
    }
  }

  // Если пользователь не авторизован или не имеет прав, показываем сообщение о загрузке
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-[#090b0d]/90 dark:border-[#181c22]">
          <div className="w-full px-4 mx-auto flex h-16 items-center justify-between">
            <MainNav />
            <div className="flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1">
          <div className="w-full px-4 py-6 mx-auto">
            <div className="text-center p-8">
              <p className="text-muted-foreground">Загрузка...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-[#090b0d]/90 dark:border-[#181c22]">
        <div className="w-full px-4 mx-auto flex h-16 items-center justify-between">
          <MainNav />
          <div className="flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="w-full px-4 py-6 mx-auto">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Archive className="h-6 w-6 text-[hsl(var(--saas-purple))]" />
                  Архив публикаций
                </CardTitle>
                <CardDescription>
                  Архивированные публикации доступны только для учителей и администраторов
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push("/")}>
                Вернуться на главную
              </Button>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">Архив пуст</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 hover:border-[hsl(var(--saas-purple)/0.5)] transition-all duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <Link href={`/posts/${post.id}`}>
                          <h3 className="text-xl font-semibold hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                            {post.title}
                          </h3>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setPostToRestore(post.id)}
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
                              <AlertDialogCancel onClick={() => setPostToRestore(null)}>Отмена</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleRestore}
                                disabled={isRestoring}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {isRestoring ? "Восстановление..." : "Восстановить"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-[hsl(var(--saas-purple))]">
                          {post.author.username}
                        </Badge>
                        <Badge variant="outline">
                          {post.category === "news" ? "Новости" : 
                           post.category === "materials" ? "Учебные материалы" : 
                           post.category === "project-ideas" ? "Идеи для проектов" : 
                           "Другое"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-4">{new Date(post.created_at).toLocaleDateString("ru-RU")}</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.commentsCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{post.likesCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{post.viewsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
