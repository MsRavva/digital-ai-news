"use client"

import type React from "react"
import { useState, useRef, ChangeEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EnhancedTextarea } from "@/components/enhanced-textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, LinkIcon, Loader2 } from "lucide-react"
import { LinkPopover } from "./link-popover"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { createPost } from "@/lib/firebase-db"
import { Progress } from "@/components/ui/progress"
import { SimpleAvatar } from "@/components/ui/simple-avatar"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Attachment {
  type: 'link';
  name: string;
  url?: string;
}

interface PreviewData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  attachments: Attachment[];
  author: {
    username: string;
    role: string;
  };
  created_at: string;
}

export function CreatePostForm() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<string>("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Отслеживаем изменения в showPreview и previewData
  useEffect(() => {
    console.log('useEffect: showPreview changed to', showPreview);
    console.log('useEffect: previewData is', previewData ? 'available' : 'null');
  }, [showPreview, previewData])

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



  const handleAttachmentRemove = (name: string) => {
    setAttachments(prev => prev.filter(a => a.name !== name));
  };

  const handleLinkAdd = (url: string, name: string) => {
    if (url) {
      setAttachments(prev => [...prev, {
        type: 'link',
        name: name || url,
        url
      }]);
    }
  };

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
      // Подготавливаем данные для создания поста
      const postData = {
        title,
        content,
        category,
        author_id: user.uid,
        tags,
      };

      // Если есть прикрепленные ссылки, добавляем их в содержимое
      if (attachments.length > 0) {
        const attachmentsContent = attachments.map(a => {
          return `[Ссылка: ${a.name}](${a.url})`;
        }).filter(Boolean).join('\n\n');

        postData.content = `${content}\n\n${attachmentsContent}`;
      }

      // Создаем пост в Firebase
      const postId = await createPost(postData);

      if (!postId) {
        throw new Error("Не удалось создать публикацию");
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

  // Функция для отображения предпросмотра
  const renderPreview = () => {
    console.log('renderPreview called, previewData:', previewData);
    if (!previewData) {
      console.log('No preview data available');
      return null;
    }

    // Функция для обрезки длинных строк
    const truncateString = (str: string, maxLength: number) => {
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength) + '...';
    };

    // Преобразуем содержимое с прикрепленными файлами
    let fullContent = previewData.content;

    if (previewData.attachments.length > 0) {
      const attachmentsContent = previewData.attachments.map(a => {
        // Обрезаем длинные ссылки
        const displayName = truncateString(a.name, 60);
        return `[Ссылка: ${displayName}](${a.url})`;
      }).filter(Boolean).join('\n\n');

      fullContent = `${previewData.content}\n\n${attachmentsContent}`;
    }

    // Используем ReactMarkdown для преобразования Markdown в HTML

    // Определяем название категории
    const categoryName = {
      'news': 'Новости',
      'materials': 'Учебные материалы',
      'project-ideas': 'Идеи для проектов'
    }[previewData.category] || previewData.category;

    // Форматируем дату
    const formattedDate = new Date(previewData.created_at).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <Card className="p-6 mb-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <SimpleAvatar username={previewData.author.username} size="md" />
              <div>
                <div className="font-medium">{previewData.author.username}</div>
                <div className="text-sm text-muted-foreground">{formattedDate}</div>
              </div>
            </div>
            <Badge variant="outline">{categoryName}</Badge>
          </div>
          <h2 className="text-2xl font-bold mb-4">{previewData.title}</h2>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {fullContent}
            </ReactMarkdown>
          </div>
        </div>
        {previewData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {previewData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              console.log('Back to editing clicked');
              setTimeout(() => {
                setShowPreview(false);
                console.log('showPreview set to false');
              }, 0);
            }}
          >
            Вернуться к редактированию
          </Button>
          <Button
            type="button"
            onClick={() => {
              console.log('Publish from preview clicked');
              // Здесь можно добавить логику публикации
              setTimeout(() => {
                setShowPreview(false);
                console.log('showPreview set to false');

                // Имитируем отправку формы после небольшой задержки
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) {
                    console.log('Submitting form');
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  } else {
                    console.log('Form not found');
                  }
                }, 100);
              }, 0);
            }}
            className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white"
          >
            Опубликовать
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <>
      {console.log('Rendering component, showPreview:', showPreview)}
      {showPreview ? (
        <>
          {console.log('Showing preview')}
          {renderPreview()}
        </>
      ) : (
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
                <SelectItem value="project-ideas">Идеи для проектов</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Содержание</Label>
            <EnhancedTextarea
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

          <div className="space-y-4">
            <div>
              <Label>Прикрепить</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <LinkPopover onLinkAdd={handleLinkAdd} />
              </div>
            </div>

            {/* Список прикрепленных ссылок */}
            {attachments.length > 0 && (
              <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                <h4 className="text-sm font-medium">Прикрепленные ссылки:</h4>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <LinkIcon className="h-4 w-4 text-blue-500" />
                        <span className="text-sm truncate">{attachment.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleAttachmentRemove(attachment.name)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              console.log('Preview button clicked');
              console.log('Title:', title);
              console.log('Content:', content);
              console.log('Category:', category);

              if (!title || !content || !category) {
                console.log('Missing required fields');
                toast({
                  title: "Ошибка",
                  description: "Пожалуйста, заполните все обязательные поля",
                  variant: "destructive",
                })
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
                  username: profile?.username || "Unknown",
                  role: profile?.role || "student"
                },
                created_at: new Date().toISOString()
              };

              console.log('Setting preview data and showPreview');
              // Сначала устанавливаем данные предпросмотра
              setPreviewData(previewDataObj);

              // Затем включаем режим предпросмотра в следующем цикле обновления
              setTimeout(() => {
                setShowPreview(true);
                console.log('showPreview set to true');
                // Прокручиваем страницу вверх, чтобы увидеть предпросмотр
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 0);
            }}
          >
            Предпросмотр
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Публикация...
              </>
            ) : (
              "Опубликовать"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
      )}
    </>
  )
}
