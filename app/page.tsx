'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { PostsList } from "@/components/posts-list"
import { PostsTable } from "@/components/posts-table"
import { InfinitePostsList } from "@/components/infinite-posts-list"
import { PaginatedPostsTable } from "@/components/paginated-posts-table"
import { TagsFilter } from "@/components/tags-filter"
import { ViewToggle } from "@/components/view-toggle"
import { CategoryFilter } from "@/components/category-filter"
import { getAllTags } from "@/lib/client-api"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"

export default function Home() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState(() => {
    // Инициализируем состояние из localStorage, если доступно
    if (typeof window !== 'undefined') {
      const savedCategory = localStorage.getItem('selectedCategory')
      return savedCategory || 'all'
    }
    return 'all'
  })
  const [tags, setTags] = useState([])
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    // Инициализируем режим просмотра из localStorage, если доступно
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('viewMode') as 'grid' | 'table' | null
      return savedView || 'table'
    }
    return 'table'
  })
  const [loading, setLoading] = useState(true)
  const [categoryKey, setCategoryKey] = useState(0) // Ключ для принудительного обновления компонентов

  // Загрузка тегов
  useEffect(() => {
    const fetchTags = async () => {
      try {
        console.log('Загрузка тегов...')
        // Загружаем теги
        const allTags = await getAllTags()
        console.log('Теги:', allTags)
        setTags(allTags)
      } catch (error) {
        console.error("Ошибка при загрузке тегов:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  const handleViewChange = (view: 'grid' | 'table') => {
    // Сохраняем режим просмотра в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewMode', view)
    }
    setViewMode(view)
  }

  const handleCategoryChange = (category: string) => {
    console.log('Home: Изменение категории на', category);

    // Сохраняем выбранную категорию в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCategory', category);
    }

    setSelectedCategory(category);
    // Увеличиваем ключ для принудительного обновления компонентов списка публикаций
    setCategoryKey(prevKey => prevKey + 1);
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
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <CategoryFilter
                          onCategoryChange={handleCategoryChange}
                          initialCategory={selectedCategory}
                        />
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
                        <ViewToggle onViewChange={handleViewChange} initialView={viewMode} />
                        <Link href="/create">
                          <Button variant="saas" size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Создать публикацию
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <Card className="p-0 border-0 shadow-none dark:bg-transparent">
                      {viewMode === 'grid' ? (
                        <InfinitePostsList
                          key={`infinite-${categoryKey}`}
                          category={selectedCategory !== 'all' ? selectedCategory : undefined}
                          initialLimit={10}
                        />
                      ) : (
                        <PaginatedPostsTable
                          key={`paginated-${categoryKey}`}
                          category={selectedCategory !== 'all' ? selectedCategory : undefined}
                          pageSize={10}
                        />
                      )}
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      </main>


    </div>
  )
}
