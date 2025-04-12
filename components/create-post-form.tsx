"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Upload, FileText, ImageIcon, LinkIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"

export function CreatePostForm() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<string>("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны войти в систему, чтобы создать публикацию",
        variant: "destructive",
      })
      return
    }

    if (!title || !content || !category) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.rpc("create_post", {
        title_param: title,
        content_param: content,
        category_param: category,
        tags_param: tags,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Успех",
        description: "Публикация успешно создана",
      })

      router.push("/")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Произошла ошибка при создании публикации",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Новая публикация</CardTitle>
          <CardDescription>Создайте новую публикацию для обмена новостями, ссылками или файлами.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              placeholder="Введите заголовок публикации"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="news">Новости</SelectItem>
                <SelectItem value="materials">Учебные материалы</SelectItem>
                <SelectItem value="discussions">Обсуждения</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Содержание</Label>
            <Textarea
              id="content"
              placeholder="Введите содержание публикации"
              className="min-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Теги</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                </Badge>
              ))}
            </div>
            <Input
              id="tags"
              placeholder="Добавьте теги и нажмите Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
          </div>

          <div className="space-y-2">
            <Label>Прикрепить</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" />
                Ссылка
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                Изображение
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Документ
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
                <Upload className="h-4 w-4" />
                Загрузить файл
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button">
            Предпросмотр
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Публикация..." : "Опубликовать"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
