"use client"

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { InfinitePostsList } from "@/components/infinite-posts-list"
import { PaginatedPostsTable } from "@/components/paginated-posts-table"
import { ViewToggle } from "@/components/view-toggle"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import Link from "next/link"

export default function ArchivePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('archiveViewMode') as 'grid' | 'table' | null
      return savedView || 'table'
    }
    return 'table'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryKey, setCategoryKey] = useState(0)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Проверка прав доступа
  useEffect(() => {
    if (profile && profile.role !== "teacher" && profile.role !== "admin") {
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав для просмотра архива",
        variant: "destructive"
      })
      router.push("/")
    }
  }, [profile, router, toast])

  const handleViewChange = (view: 'grid' | 'table') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('archiveViewMode', view)
    }
    setViewMode(view)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setCategoryKey(prevKey => prevKey + 1)
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
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Архив публикаций</h1>
                  <p className="text-muted-foreground">
                    Архивированные публикации доступны только для учителей и администраторов
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Поиск в архиве..."
                      className="w-full max-w-[200px] pl-9 h-9"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {searchQuery && (
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                        onClick={() => setSearchQuery('')}
                        aria-label="Очистить поиск"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <ViewToggle onViewChange={handleViewChange} initialView={viewMode} />
                  <Button variant="outline" onClick={() => router.push("/")}>
                    Вернуться на главную
                  </Button>
                </div>
              </div>

              {searchQuery && (
                <div className="mb-4 p-2 bg-[hsl(var(--saas-purple)/0.1)] rounded-md text-sm flex items-center justify-between">
                  <div className="flex items-center">
                    <Search className="h-4 w-4 mr-2 text-[hsl(var(--saas-purple))]" />
                    <span>Поиск: <span className="font-medium">{searchQuery}</span></span>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-foreground flex items-center"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4 mr-1" />
                    <span>Очистить</span>
                  </button>
                </div>
              )}

              <Card className="p-0 border-0 shadow-none dark:bg-transparent">
                {viewMode === 'grid' ? (
                  <InfinitePostsList
                    key={`infinite-${categoryKey}`}
                    includeArchived={true}
                    archivedOnly={true}
                    initialLimit={10}
                    searchQuery={searchQuery}
                  />
                ) : (
                  <PaginatedPostsTable
                    key={`paginated-${categoryKey}`}
                    includeArchived={true}
                    archivedOnly={true}
                    pageSize={10}
                    searchQuery={searchQuery}
                  />
                )}
              </Card>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
