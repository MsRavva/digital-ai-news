"use client"

import { MainNav } from "@/components/main-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/context/auth-context"
import { getBookmarkedPosts, getPosts } from "@/lib/client-api"
import { validateUsername } from "@/lib/validation"
import type { Post } from "@/types/database"
import { Bookmark, Eye, MessageSquare, Pencil, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const updateParam = searchParams.get("update")
  // Режим редактирования всегда активен
  const [isEditing] = useState(true)
  const [formData, setFormData] = useState({
    username: "",
  })
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string
  }>({})
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBookmarks, setLoadingBookmarks] = useState(true)
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    likes: 0,
  })

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
    const updateParam = searchParams.get("update")
    if (updateParam === "username" && profile) {
      // Фокусируемся на поле имени пользователя
      setTimeout(() => {
        const usernameInput = document.getElementById("username")
        if (usernameInput) {
          usernameInput.focus()
          // Прокручиваем к полю
          usernameInput.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 500)
    }
  }, [searchParams, profile])

  // Проверка валидации имени пользователя при изменении
  useEffect(() => {
    // Пропускаем первый рендер с пустым значением
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

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (user) {
        try {
          const posts = await getPosts()
          // Фильтруем посты текущего пользователя (в реальном приложении это должно делаться на сервере)
          const filteredPosts = posts.filter(
            (post) => post.author?.username === profile?.username,
          )
          setUserPosts(filteredPosts)
          setStats({
            posts: filteredPosts.length,
            comments: filteredPosts.reduce(
              (acc, post) => acc + (post.commentsCount || 0),
              0,
            ),
            likes: filteredPosts.reduce(
              (acc, post) => acc + (post.likesCount || 0),
              0,
            ),
          })
        } catch (error) {
          console.error("Ошибка при загрузке публикаций пользователя:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserPosts()
  }, [user, profile])

  // Загрузка избранных постов
  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      if (user) {
        try {
          const posts = await getBookmarkedPosts(user.uid)
          setBookmarkedPosts(posts)
        } catch (error) {
          console.error("Ошибка при загрузке избранных публикаций:", error)
        } finally {
          setLoadingBookmarks(false)
        }
      }
    }

    fetchBookmarkedPosts()
  }, [user])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !profile) return

    // Проверка валидации имени пользователя перед отправкой
    const usernameError = validateUsername(formData.username)
    if (usernameError) {
      setValidationErrors((prev) => ({ ...prev, username: usernameError }))
      toast({
        title: "Ошибка валидации",
        description: usernameError,
        variant: "destructive",
      })
      return
    }

    try {
      const updatedProfile = {
        username: formData.username,
      }

      const { success, error } = await updateProfile(updatedProfile)

      if (success) {
        toast({
          title: "Профиль обновлен",
          description: "Ваш профиль был успешно обновлен",
        })

        // Если был параметр update, удаляем его из URL
        if (updateParam) {
          window.history.replaceState({}, "", "/profile")
        }
      } else {
        toast({
          title: "Ошибка",
          description: error?.message || "Не удалось обновить профиль",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при обновлении профиля",
        variant: "destructive",
      })
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm dark:bg-background/90 dark:border-border">
          <div className="flex h-16 items-center px-4 sm:px-6">
            <MainNav />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            <div className="saas-window mb-8">
              <div className="saas-window-header">
                <div className="saas-window-dot saas-window-dot-red"></div>
                <div className="saas-window-dot saas-window-dot-yellow"></div>
                <div className="saas-window-dot saas-window-dot-green"></div>
              </div>
              <div className="p-6">
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Пожалуйста, войдите в систему для просмотра профиля
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm dark:bg-background/90 dark:border-border">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="saas-window mb-8">
            <div className="saas-window-header">
              <div className="saas-window-dot saas-window-dot-red"></div>
              <div className="saas-window-dot saas-window-dot-yellow"></div>
              <div className="saas-window-dot saas-window-dot-green"></div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Профиль пользователя */}
                <div className="md:col-span-1">
                  <Card className="mb-6">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Редактирование профиля</CardTitle>
                      </div>
                    </CardHeader>
                <CardContent className="text-center">
                  <div className="flex flex-col items-center">
                    <SimpleAvatar
                      username={profile.username}
                      size="xl"
                      className="h-24 w-24 text-2xl mb-4"
                    />
                    <h2 className="text-2xl font-bold">{profile.username}</h2>
                    <Badge variant="outline" className="mt-1 mb-2">
                      {profile.role === "teacher"
                        ? "Учитель"
                        : profile.role === "admin"
                          ? "Администратор"
                          : "Ученик"}
                    </Badge>
                    <p className="text-muted-foreground">{user.email}</p>

                    <form
                      onSubmit={handleSubmit}
                      className="w-full mt-4 text-left"
                    >
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">Имя пользователя</Label>
                          <Input
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className={`mt-1 ${validationErrors.username || updateParam === "username" ? "border-red-500 focus-visible:ring-red-500" : ""} ${updateParam === "username" ? "animate-pulse" : ""}`}
                            placeholder="Иван Иванов"
                          />
                          {validationErrors.username && (
                            <p className="text-red-500 text-sm mt-1">
                              {validationErrors.username}
                            </p>
                          )}
                          {updateParam === "username" &&
                            !validationErrors.username && (
                              <p className="text-amber-500 text-sm mt-1">
                                Пожалуйста, введите корректные Имя и Фамилию на
                                русском языке
                              </p>
                            )}
                          <p className="text-muted-foreground text-xs mt-1">
                            Укажите имя и фамилию на русском языке, например:
                            Иван Иванов
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white"
                          >
                            Сохранить изменения
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-[hsl(var(--saas-purple))]">
                        {stats.posts}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Публикаций
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[hsl(var(--saas-purple))]">
                        {stats.comments}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Комментариев
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[hsl(var(--saas-purple))]">
                        {stats.likes}
                      </p>
                      <p className="text-sm text-muted-foreground">Лайков</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Публикации пользователя */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <Tabs defaultValue="posts" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="posts"
                        className="flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Мои публикации
                      </TabsTrigger>
                      <TabsTrigger
                        value="bookmarks"
                        className="flex items-center gap-2"
                      >
                        <Bookmark className="h-4 w-4" />
                        Избранное
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="pt-4">
                      {loading ? (
                        <div className="text-center p-4">
                          <p className="text-muted-foreground">
                            Загрузка публикаций...
                          </p>
                        </div>
                      ) : userPosts.length === 0 ? (
                        <div className="text-center p-4">
                          <p className="text-muted-foreground">
                            У вас пока нет публикаций
                          </p>
                          <Button className="mt-4 bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white">
                            <Link href="/create">Создать публикацию</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {userPosts.map((post) => (
                            <div
                              key={post.id}
                              className="border rounded-lg p-4 hover:border-[hsl(var(--saas-purple)/0.5)] transition-all duration-200"
                            >
                              <Link href={`/posts/${post.id}`}>
                                <h3 className="text-xl font-semibold mb-2 hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                                  {post.title}
                                </h3>
                              </Link>
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {post.content}
                              </p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {post.tags?.map((tag) => (
                                  <Badge 
                                    key={tag} 
                                    className="text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.3)] dark:border-[hsl(var(--saas-purple)/0.5)] shadow-sm dark:shadow-[hsl(var(--saas-purple)/0.2)] bg-white dark:bg-[hsl(var(--saas-purple)/0.1)]"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <span className="mr-4">
                                  {new Date(post.created_at).toLocaleDateString(
                                    "ru-RU",
                                  )}
                                </span>
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
                    </TabsContent>

                    <TabsContent value="bookmarks" className="pt-4">
                      {loadingBookmarks ? (
                        <div className="text-center p-4">
                          <p className="text-muted-foreground">
                            Загрузка избранных публикаций...
                          </p>
                        </div>
                      ) : bookmarkedPosts.length === 0 ? (
                        <div className="text-center p-4">
                          <p className="text-muted-foreground">
                            У вас пока нет избранных публикаций
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Добавляйте публикации в избранное, нажимая на иконку
                            закладки в публикации
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookmarkedPosts.map((post) => (
                            <div
                              key={post.id}
                              className="border rounded-lg p-4 hover:border-[hsl(var(--saas-purple)/0.5)] transition-all duration-200"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <Link href={`/posts/${post.id}`}>
                                  <h3 className="text-xl font-semibold hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                                    {post.title}
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {post.author.username}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {post.content}
                              </p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {post.tags?.map((tag) => (
                                  <Badge 
                                    key={tag} 
                                    className="text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.3)] dark:border-[hsl(var(--saas-purple)/0.5)] shadow-sm dark:shadow-[hsl(var(--saas-purple)/0.2)] bg-white dark:bg-[hsl(var(--saas-purple)/0.1)]"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <span className="mr-4">
                                  {new Date(post.created_at).toLocaleDateString(
                                    "ru-RU",
                                  )}
                                </span>
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
                    </TabsContent>
                  </Tabs>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
    </div>
  )
}