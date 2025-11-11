"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { HeroHeader } from "@/components/header"
import { PostsDataTable } from "@/components/posts-data-table"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

export default function ArchivePage() {
  const { profile } = useAuth()
  const router = useRouter()

  // Проверка прав доступа
  useEffect(() => {
    if (profile && profile.role !== "teacher" && profile.role !== "admin") {
      toast.error("Доступ запрещен", {
        description: "У вас нет прав для просмотра архива",
      })
      router.push("/")
    }
  }, [profile, router])

  // Показываем загрузку, пока проверяем права
  if (!profile) {
    return (
      <>
        <HeroHeader />
        <div className="container mx-auto w-full lg:w-[60%] pt-24 pb-8 px-4">
          <Card>
            <div className="p-8 text-center text-muted-foreground">
              Загрузка...
            </div>
          </Card>
        </div>
      </>
    )
  }

  // Если не учитель и не админ, не показываем контент (редирект уже выполнен)
  if (profile.role !== "teacher" && profile.role !== "admin") {
    return null
  }

  return (
    <>
      <HeroHeader />
      <div className="container mx-auto w-[60%] pt-24 pb-8 px-4">
        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Архив публикаций</h1>
            <p className="text-muted-foreground">
              Архивированные публикации доступны только для учителей и
              администраторов
            </p>
          </div>
          <PostsDataTable archivedOnly={true} />
        </Card>
      </div>
    </>
  )
}

