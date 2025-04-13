'use client'

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { Badge } from "@/components/ui/badge"
import { getPosts } from "@/lib/client-api"
import { Post } from "@/types/database"
import Link from "next/link"
import { MessageSquare, ThumbsUp, Eye, Plus, Pencil, Trash2 } from "lucide-react"

export default function MyPostsPage() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<{
    all: Post[];
    news: Post[];
    materials: Post[];
    'project-ideas': Post[];
  }>({
    all: [],
    news: [],
    materials: [],
    'project-ideas': []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (user) {
        try {
          const allPosts = await getPosts()
          // Фильтруем посты текущего пользователя (в реальном приложении это должно делаться на сервере)
          const userPosts = allPosts.filter(post => post.author?.username === profile?.username)

          setPosts({
            all: userPosts,
            news: userPosts.filter(post => post.category === 'news'),
            materials: userPosts.filter(post => post.category === 'materials'),
            'project-ideas': userPosts.filter(post => post.category === 'project-ideas')
          })
        } catch (error) {
          console.error('Ошибка при загрузке публикаций пользователя:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchUserPosts()
  }, [user, profile])

  if (!user || !profile) {
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
          <div className="mx-auto max-w-6xl">
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">Пожалуйста, войдите в систему для просмотра ваших публикаций</p>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const renderPosts = (categoryPosts: Post[]) => {
    if (loading) {
      return (
        <div className="text-center p-4">
          <p className="text-muted-foreground">Загрузка публикаций...</p>
        </div>
      )
    }

    if (categoryPosts.length === 0) {
      return (
        <div className="text-center p-4">
          <p className="text-muted-foreground">У вас пока нет публикаций в этой категории</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {categoryPosts.map((post) => (
          <div key={post.id} className="border rounded-lg p-4 hover:border-[hsl(var(--saas-purple)/0.5)] transition-all duration-200">
            <div className="flex justify-between items-start mb-2">
              <Link href={`/posts/${post.id}`}>
                <h3 className="text-xl font-semibold hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                  {post.title}
                </h3>
              </Link>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[hsl(var(--saas-purple))]">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
        <div className="mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Мои публикации</h1>
            <Link href="/create">
              <Button className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white">
                <Plus className="mr-2 h-4 w-4" /> Создать публикацию
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Все</TabsTrigger>
                  <TabsTrigger value="news">Новости</TabsTrigger>
                  <TabsTrigger value="materials">Учебные материалы</TabsTrigger>
                  <TabsTrigger value="project-ideas">Идеи для проектов</TabsTrigger>
                </TabsList>
                <CardContent className="pt-6">
                  <TabsContent value="all">
                    {renderPosts(posts.all)}
                  </TabsContent>
                  <TabsContent value="news">
                    {renderPosts(posts.news)}
                  </TabsContent>
                  <TabsContent value="materials">
                    {renderPosts(posts.materials)}
                  </TabsContent>
                  <TabsContent value="project-ideas">
                    {renderPosts(posts['project-ideas'])}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
