'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { PostsList } from "@/components/posts-list"
import { PostsTable } from "@/components/posts-table"
import { TagsFilter } from "@/components/tags-filter"
import { ViewToggle } from "@/components/view-toggle"
import { getPosts, getAllTags } from "@/lib/client-api"
import Link from "next/link"
import { Search, Plus, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"

export default function Home() {
  const { user } = useAuth()
  const [posts, setPosts] = useState({
    all: [],
    news: [],
    materials: [],
    'project-ideas': []
  })
  const [tags, setTags] = useState([])
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Загрузка данных...')
        // Делаем только один запрос для всех постов
        const allPosts = await getPosts()
        console.log('Все посты:', allPosts)

        // Фильтруем посты на клиенте
        const newsPosts = allPosts.filter(post => post.category === "news")
        const materialsPosts = allPosts.filter(post => post.category === "materials")
        const projectIdeasPosts = allPosts.filter(post => post.category === "project-ideas")

        // Загружаем теги
        const allTags = await getAllTags()
        console.log('Теги:', allTags)

        setPosts({
          all: allPosts,
          news: newsPosts,
          materials: materialsPosts,
          'project-ideas': projectIdeasPosts
        })
        setTags(allTags)
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleViewChange = (view: 'grid' | 'table') => {
    setViewMode(view)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-[#090b0d]/90 dark:border-[#181c22]">
        <div className="w-[75%] mx-auto flex h-16 items-center justify-between">
          <MainNav />
          <div className="flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="w-[75%] py-6 mx-auto">
          <div className="flex flex-col items-center mb-8 text-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">AI News</h1>
              <p className="text-muted-foreground">Последние новости и обсуждения в мире искусственного интеллекта</p>
            </div>

          </div>

          <div className="saas-window mb-8">
            <div className="saas-window-header">
              <div className="saas-window-dot saas-window-dot-red"></div>
              <div className="saas-window-dot saas-window-dot-yellow"></div>
              <div className="saas-window-dot saas-window-dot-green"></div>
            </div>
            <div className="p-6">
              <div className="w-full">
                {!user ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <h3 className="text-xl font-semibold mb-6">Для просмотра публикаций необходимо авторизоваться</h3>
                    <div className="flex space-x-4">
                      <Link href="/login">
                        <Button variant="saas" size="lg">Войти</Button>
                      </Link>
                      <Link href="/register">
                        <Button variant="saas-secondary" size="lg">Регистрация</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Tabs defaultValue="all" className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <div className="filter-container">
                          <TabsList className="bg-transparent border-none p-0 shadow-none">
                            <TabsTrigger value="all" className="filter-item">Все</TabsTrigger>
                            <TabsTrigger value="news" className="filter-item">Новости</TabsTrigger>
                            <TabsTrigger value="materials" className="filter-item">Учебные материалы</TabsTrigger>
                            <TabsTrigger value="project-ideas" className="filter-item">Идеи для проектов</TabsTrigger>
                          </TabsList>
                        </div>
                        <div className="relative">
                          <Input
                            type="search"
                            placeholder="Поиск..."
                            className="w-full max-w-[200px] pl-9 h-9"
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="saas-secondary" size="sm" className="gap-1">
                          <Filter className="h-4 w-4" /> Фильтры
                        </Button>
                        <ViewToggle onViewChange={handleViewChange} initialView={viewMode} />
                        <Link href="/create">
                          <Button variant="saas" size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Создать публикацию
                          </Button>
                        </Link>
                      </div>
                    </div>
                  <TabsContent value="all">
                    <Card className="p-0 border-0 shadow-none dark:bg-transparent">
                      {loading ? (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground">Загрузка публикаций...</p>
                        </div>
                      ) : viewMode === 'grid' ? (
                        <PostsList posts={posts.all} />
                      ) : (
                        <PostsTable posts={posts.all} />
                      )}
                    </Card>
                  </TabsContent>
                  <TabsContent value="news">
                    <Card className="p-0 border-0 shadow-none dark:bg-transparent">
                      {loading ? (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground">Загрузка публикаций...</p>
                        </div>
                      ) : viewMode === 'grid' ? (
                        <PostsList posts={posts.news} />
                      ) : (
                        <PostsTable posts={posts.news} />
                      )}
                    </Card>
                  </TabsContent>
                  <TabsContent value="materials">
                    <Card className="p-0 border-0 shadow-none dark:bg-transparent">
                      {loading ? (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground">Загрузка публикаций...</p>
                        </div>
                      ) : viewMode === 'grid' ? (
                        <PostsList posts={posts.materials} />
                      ) : (
                        <PostsTable posts={posts.materials} />
                      )}
                    </Card>
                  </TabsContent>
                  <TabsContent value="project-ideas">
                    <Card className="p-0 border-0 shadow-none dark:bg-transparent">
                      {loading ? (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground">Загрузка публикаций...</p>
                        </div>
                      ) : viewMode === 'grid' ? (
                        <PostsList posts={posts['project-ideas']} />
                      ) : (
                        <PostsTable posts={posts['project-ideas']} />
                      )}
                    </Card>
                  </TabsContent>
                </Tabs>
                )}
              </div>
            </div>
          </div>


        </div>
      </main>


    </div>
  )
}
