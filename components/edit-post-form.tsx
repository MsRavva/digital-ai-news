"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Loader2, Pencil } from "lucide-react"
import { useAuth } from "@/context/auth-context-supabase"
import { toast } from "sonner"
import { getPostById, updatePost } from "@/lib/supabase-posts-api"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Post } from "@/types/database"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface EditPostFormProps {
  postId: string
}

export function EditPostForm({ postId }: EditPostFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<string>("news")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPost, setIsLoadingPost] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const { user, profile } = useAuth()
  const router = useRouter()

  // Загрузка данных поста
  useEffect(() => {
    const fetchPost = async () => {
      if (!user) return

      try {
        setIsLoadingPost(true)
        const postData = await getPostById(postId)

        if (!postData) {
          setError("Публикация не найдена")
          return
        }

        // Проверяем права на редактирование
        const isOwner = postData.author?.username === profile?.username
        const isTeacherOrAdmin =
          profile?.role === "teacher" || profile?.role === "admin"

        if (!isOwner && !isTeacherOrAdmin) {
          setError("У вас нет прав на редактирование этой публикации")
          return
        }

        setCanEdit(true)

        // Заполняем форму данными поста
        setTitle(postData.title)
        setContent(postData.content)
        setCategory(postData.category)
        setTags(postData.tags || [])
      } catch (error) {
        console.error("Ошибка при загрузке публикации:", error)
        setError("Ошибка при загрузке публикации")
      } finally {
        setIsLoadingPost(false)
      }
    }

    fetchPost()
  }, [postId, user, profile])

  // Обработчик добавления тега
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  // Обработчик удаления тега
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  // Обработчик нажатия Enter в поле ввода тега
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Необходимо авторизоваться для обновления публикации")
      return
    }

    if (!title || !content || !category) {
      toast.error("Заполните все обязательные поля")
      return
    }

    setIsLoading(true)

    try {
      const postData = {
        id: postId,
        title,
        content,
        category,
        tags,
      }

      const success = await updatePost(postData)

      if (!success) {
        throw new Error("Не удалось обновить публикацию")
      }

      toast.success("Публикация успешно обновлена")
      router.push(`/posts/${postId}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Произошла ошибка при обновлении публикации")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingPost) {
    return (
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
    )
  }

  if (error || !canEdit) {
    return (
      <Card className={cn(
        "rounded-3xl border-border/50 dark:border-white/[0.1] transition-all duration-300",
        "shadow-[0_2px_15px_rgba(0,0,0,0.08),0_8px_25px_rgba(0,0,0,0.05)]",
        "dark:shadow-[0_2px_20px_rgba(98,51,255,0.12),0_8px_35px_rgba(98,51,255,0.08),0_0_0_1px_rgba(255,255,255,0.03)]"
      )}>
        <CardContent className="text-center py-8">
          <p className="text-destructive mb-4">
            {error || "У вас нет прав на редактирование этой публикации"}
          </p>
          <Button onClick={() => router.push("/")}>Вернуться на главную</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "rounded-3xl border-border/50 dark:border-white/[0.1] transition-all duration-300",
      "shadow-[0_2px_15px_rgba(0,0,0,0.08),0_8px_25px_rgba(0,0,0,0.05)]",
      "dark:shadow-[0_2px_20px_rgba(98,51,255,0.12),0_8px_35px_rgba(98,51,255,0.08),0_0_0_1px_rgba(255,255,255,0.03)]",
      "hover:shadow-[0_4px_25px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.08)]",
      "dark:hover:shadow-[0_4px_30px_rgba(98,51,255,0.18),0_12px_50px_rgba(98,51,255,0.12),0_0_0_1px_rgba(255,255,255,0.05)]"
    )}>
      <CardHeader>
        <CardTitle>Редактирование публикации</CardTitle>
        <CardDescription>Обновите информацию о вашей публикации</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="title">Заголовок</Label>
              <Input
                id="title"
                placeholder="Введите заголовок"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="content">Содержание</Label>
              <MarkdownEditor
                value={content}
                onChange={(value) => setContent(value)}
                height={500}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="category">Категория</Label>
              <Tabs value={category} onValueChange={setCategory}>
                <TabsList>
                  <TabsTrigger value="news">Новости</TabsTrigger>
                  <TabsTrigger value="materials">Учебные материалы</TabsTrigger>
                  <TabsTrigger value="project-ideas">Идеи проектов</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="tags">Теги</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Добавьте тег"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Добавить
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/posts/${postId}`)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Сохранить изменения
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

