"use client"

import { EnhancedTextarea } from "@/components/enhanced-textarea"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { MDEditor } from "@/components/md-editor"
import { PublicationCategoryTabs } from "@/components/publication-category-tabs"
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
import { Progress } from "@/components/ui/progress"
import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { getPostById, updatePost } from "@/lib/client-api"
import type { Post } from "@/types/database"
import { LinkIcon, Loader2, Pencil, X } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import { LinkPopover } from "./link-popover"

interface Attachment {
  type: "link"
  name: string
  url?: string
}

interface PreviewData {
  title: string
  content: string
  category: string
  tags: string[]
  attachments: Attachment[]
  author: {
    username: string
    role: string
  }
  created_at: string
}

interface EditPostFormProps {
  postId: string
}

export function EditPostForm({ postId }: EditPostFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<string>("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPost, setIsLoadingPost] = useState(true)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const { user, profile } = useAuth()
  const { toast } = useToast()
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

        setPost(postData)

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
        // Устанавливаем контент с небольшой задержкой, чтобы дать редактору время инициализироваться
        setTimeout(() => {
          setContent(postData.content)
        }, 0)
        setCategory(postData.category)
        setTags(postData.tags || [])

        // Отладочный вывод
        console.log("Post data loaded:", postData)
        console.log("Content set to:", postData.content)

        // Инициализируем пустой массив вложений
        setAttachments([])
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

  // Обработчик добавления ссылки
  const handleAddLink = (url: string, name: string) => {
    if (!url || !name) return

    setAttachments([
      ...attachments,
      {
        type: "link",
        name,
        url,
      },
    ])
  }

  // Обработчик удаления вложения
  const handleRemoveAttachment = (attachment: Attachment) => {
    setAttachments(attachments.filter((a) => a !== attachment))
  }

  // Обработчик предпросмотра
  const handlePreview = () => {
    console.log("Preview button clicked")
    if (!user || !profile) {
      console.log("No user or profile")
      return
    }

    // Создаем данные для предпросмотра
    const previewDataObj = {
      title,
      content,
      category,
      tags,
      attachments,
      author: {
        username: profile.username || "Unknown",
        role: profile.role || "student",
      },
      created_at: new Date().toISOString(),
    }

    console.log("Setting preview data:", previewDataObj)
    setPreviewData(previewDataObj)
  }

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Ошибка",
        description: "Необходимо авторизоваться для обновления публикации",
        variant: "destructive",
      })
      return
    }

    if (!title || !content || !category) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Подготавливаем данные для обновления поста
      const postData = {
        id: postId,
        title,
        content,
        category,
        tags,
      }

      // Используем контент как есть, без извлечения или добавления ссылок

      // Обновляем пост в Firebase
      const success = await updatePost(postData)

      if (!success) {
        throw new Error("Не удалось обновить публикацию")
      }

      toast({
        title: "Успех",
        description: "Публикация успешно обновлена",
      })

      router.push(`/posts/${postId}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description:
          error.message || "Произошла ошибка при обновлении публикации",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Функция для отображения предпросмотра
  const renderPreview = () => {
    if (!previewData) return null

    // Функция для обрезки длинных строк
    const truncateString = (str: string, maxLength: number) => {
      if (str.length <= maxLength) return str
      return str.substring(0, maxLength) + "..."
    }

    // Используем контент как есть
    const fullContent = previewData.content

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Предпросмотр</CardTitle>
          <CardDescription>Так будет выглядеть ваша публикация</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="post-preview">
            <div className="flex items-center space-x-4 mb-4">
              <SimpleAvatar username={previewData.author.username} size="md" />
              <div>
                <div className="font-medium">{previewData.author.username}</div>
                <div className="flex items-center">
                  <Badge variant="outline">
                    {previewData.author.role === "teacher"
                      ? "Учитель"
                      : "Ученик"}
                  </Badge>
                  <span className="text-sm text-muted-foreground ml-2">
                    {new Date(previewData.created_at).toLocaleDateString(
                      "ru-RU",
                    )}
                  </span>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">{previewData.title}</h2>
            <MarkdownRenderer
              content={fullContent}
              className="edit-preview-markdown-content mb-4"
            />
            {previewData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {previewData.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoadingPost) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Загрузка публикации...
          </span>
        </div>
      </Card>
    )
  }

  if (error || !canEdit) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {error || "У вас нет прав на редактирование этой публикации"}
          </p>
          <Button onClick={() => router.push("/")}>Вернуться на главную</Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Редактирование публикации</CardTitle>
              <CardDescription>
                Обновите информацию о вашей публикации
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/posts/${postId}`)}
                className="border-[hsl(var(--saas-purple))] text-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple)/0.1)]"
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                form="edit-post-form"
                className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white"
              >
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
        </CardHeader>
        <CardContent>
          <form id="edit-post-form" onSubmit={handleSubmit}>
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
              <MDEditor
                value={content}
                onChange={(value) => {
                  console.log("MDEditor onChange called with:", value?.substring(0, 50) + (value && value.length > 50 ? '...' : ''))
                  console.log("MDEditor onChange value length:", value?.length)
                  setContent(value || "")
                }}
              />
              <div className="grid gap-3">
                <Label htmlFor="category">Категория</Label>
                <PublicationCategoryTabs
                  onCategoryChange={setCategory}
                  initialCategory={category || "news"}
                />
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
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                  >
                    Добавить
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.3)] dark:border-[hsl(var(--saas-purple)/0.5)] shadow-sm dark:shadow-[hsl(var(--saas-purple)/0.2)] bg-white dark:bg-[hsl(var(--saas-purple)/0.1)] flex items-center gap-1"
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
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/posts/${postId}`)}
              className="border-[hsl(var(--saas-purple))] text-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple)/0.1)]"
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              form="edit-post-form"
              className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white"
            >
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
        </CardFooter>
      </Card>
    </>
  )
}
