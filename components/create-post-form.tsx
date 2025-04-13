"use client"

import type React from "react"
import { useState, useRef, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Upload, FileText, ImageIcon, LinkIcon, Loader2 } from "lucide-react"
import { LinkPopover } from "./link-popover"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { createPost } from "@/lib/firebase-db"
import { uploadFile } from "@/lib/firebase-storage"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Attachment {
  type: 'link' | 'image' | 'document' | 'file';
  name: string;
  url?: string;
  file?: File;
  progress?: number;
  uploading?: boolean;
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
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

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

  // Обработчики для прикрепления файлов
  const handleFileUpload = async (file: File, type: 'image' | 'document' | 'file') => {
    if (!user) return;

    const newAttachment: Attachment = {
      type,
      name: file.name,
      file,
      progress: 0,
      uploading: true
    };

    setAttachments(prev => [...prev, newAttachment]);

    try {
      // Путь для загрузки файла в Firebase Storage
      const path = `posts/${user.uid}/${Date.now()}_${file.name}`;

      // Загружаем файл и получаем URL
      const url = await uploadFile(file, path, (progress) => {
        setUploadProgress(progress);
        setAttachments(prev => prev.map(a =>
          a.name === file.name ? { ...a, progress } : a
        ));
      });

      // Обновляем состояние с URL файла
      setAttachments(prev => prev.map(a =>
        a.name === file.name ? { ...a, url, uploading: false } : a
      ));

      toast({
        title: "Файл загружен",
        description: `Файл ${file.name} успешно загружен`,
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);

      // Удаляем неудачную загрузку из списка
      setAttachments(prev => prev.filter(a => a.name !== file.name));

      toast({
        title: "Ошибка загрузки",
        description: error.message || "Произошла ошибка при загрузке файла",
        variant: "destructive",
      });
    } finally {
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], 'file');
    }
    // Сбрасываем значение input, чтобы можно было загрузить тот же файл повторно
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachmentRemove = (name: string) => {
    setAttachments(prev => prev.filter(a => a.name !== name));
  };

  const handleLinkAdd = (url: string) => {
    if (url) {
      setAttachments(prev => [...prev, {
        type: 'link',
        name: url,
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

      // Если есть прикрепленные файлы, добавляем их URL в содержимое
      if (attachments.length > 0) {
        const attachmentsContent = attachments.map(a => {
          if (a.type === 'link') {
            return `[Ссылка: ${a.name}](${a.url})`;
          } else if (a.type === 'image' && a.url) {
            return `![${a.name}](${a.url})`;
          } else if (a.url) {
            return `[${a.name}](${a.url})`;
          }
          return '';
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
    if (!previewData) return null;

    // Функция для обрезки длинных строк
    const truncateString = (str: string, maxLength: number) => {
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength) + '...';
    };

    // Преобразуем содержимое с прикрепленными файлами
    let fullContent = previewData.content;

    if (previewData.attachments.length > 0) {
      const attachmentsContent = previewData.attachments.map(a => {
        if (a.type === 'link') {
          // Обрезаем длинные ссылки
          const displayName = truncateString(a.name, 60);
          return `[Ссылка: ${displayName}](${a.url})`;
        } else if (a.type === 'image' && a.url) {
          return `![${a.name}](${a.url})`;
        } else if (a.url) {
          return `[${a.name}](${a.url})`;
        }
        return '';
      }).filter(Boolean).join('\n\n');

      fullContent = `${previewData.content}\n\n${attachmentsContent}`;
    }

    // Преобразуем маркдаун в HTML
    const contentHtml = fullContent
      .replace(/\n/g, '<br>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; margin: 10px 0;" />')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="post-link">$1</a>');

    // Определяем название категории
    const categoryName = {
      'news': 'Новости',
      'materials': 'Учебные материалы',
      'discussions': 'Обсуждения'
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
              <Avatar className="avatar">
                <AvatarFallback className="avatar-fallback">
                  {(() => {
                    const nameParts = previewData.author.username.split(' ');
                    if (nameParts.length >= 2) {
                      // Фамилия + Имя (первые буквы)
                      return `${nameParts[0][0]}${nameParts[1][0]}`;
                    } else {
                      // Если только одно слово, берем первые две буквы
                      return previewData.author.username.substring(0, 2);
                    }
                  })().toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{previewData.author.username}</div>
                <div className="text-sm text-muted-foreground">{formattedDate}</div>
              </div>
            </div>
            <Badge variant="outline">{categoryName}</Badge>
          </div>
          <h2 className="text-2xl font-bold mb-4">{previewData.title}</h2>
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </div>
        {previewData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {previewData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
          >
            Вернуться к редактированию
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <>
      {showPreview ? (
        renderPreview()
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

          <div className="space-y-4">
            <div>
              <Label>Прикрепить</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <LinkPopover onLinkAdd={handleLinkAdd} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Загрузить файл
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </div>

            {/* Список прикрепленных файлов */}
            {attachments.length > 0 && (
              <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                <h4 className="text-sm font-medium">Прикрепленные файлы:</h4>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {attachment.type === 'link' && <LinkIcon className="h-4 w-4 text-blue-500" />}
                        {attachment.type === 'image' && <ImageIcon className="h-4 w-4 text-green-500" />}
                        {attachment.type === 'document' && <FileText className="h-4 w-4 text-orange-500" />}
                        {attachment.type === 'file' && <FileText className="h-4 w-4 text-purple-500" />}
                        <span className="text-sm truncate">{attachment.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {attachment.uploading && (
                          <div className="w-20">
                            <Progress value={attachment.progress} className="h-2" />
                          </div>
                        )}
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
              if (!title || !content || !category) {
                toast({
                  title: "Ошибка",
                  description: "Пожалуйста, заполните все обязательные поля",
                  variant: "destructive",
                })
                return
              }

              // Создаем данные для предпросмотра
              setPreviewData({
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
              })

              setShowPreview(true)
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
