"use client"

import { MainNav } from "@/components/main-nav"
import { NewsScraper } from "@/components/news-scraper"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ScrapeNewsPage() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
      } else if (profile) {
        // Проверяем права доступа
        const isAuthorized =
          profile.role === "teacher" ||
          profile.role === "admin" ||
          user.uid === "4J9Vf4tqKOU7vDcz99h6nBu0gHx2"

        setAuthorized(isAuthorized)

        if (!isAuthorized) {
          router.push("/")
        }
      }
    }
  }, [user, profile, isLoading, router])

  if (isLoading) {
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
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--saas-purple))]" />
            <span className="ml-2">Загрузка...</span>
          </div>
        </main>
      </div>
    )
  }

  if (!authorized) {
    return null
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
        <div className="mx-auto w-full">
          <div className="saas-window mb-8">
            <div className="saas-window-header">
              <div className="saas-window-dot saas-window-dot-red"></div>
              <div className="saas-window-dot saas-window-dot-yellow"></div>
              <div className="saas-window-dot saas-window-dot-green"></div>
            </div>
            <div className="p-6">
              <h1 className="text-3xl font-bold tracking-tight mb-6">
                Импорт новостей
              </h1>
              <NewsScraper />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
