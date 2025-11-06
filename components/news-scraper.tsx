'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryTabs } from '@/components/category-tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { MarkdownContent } from '@/components/ui/markdown-content'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/context/auth-context'
import { createPost } from '@/lib/client-api'

export function NewsScraper() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [scrapedData, setScrapedData] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('url')
  const { toast } = useToast()
  const { user } = useAuth()

  // Функция для скрапинга URL
  const handleScrape = async () => {
    if (!url) {
      toast({
        title: 'Ошибка',
        description: 'Введите URL для скрапинга',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      // Получаем токен пользователя
      const token = await user?.getIdToken();

      const response = await fetch('/api/scrape-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape content');
      }

      const data = await response.json()
      setScrapedData(data)
      setTitle(data.title)
      setContent(data.content)
      setTags(data.tags || [])
      setActiveTab('preview')

      toast({
        title: 'Успех',
        description: 'Контент успешно извлечен',
      })
    } catch (error) {
      console.error('Error scraping URL:', error)
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось извлечь контент. Попробуйте другой URL.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Функция для добавления тега
  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  }

  // Функция для удаления тега
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  }

  // Функция для публикации контента
  const handlePublish = async () => {
    if (!title || !content) {
      toast({
        title: 'Ошибка',
        description: 'Заголовок и содержание обязательны',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      // Создаем публикацию
      const postData = {
        title,
        content,
        category: 'news', // Категория по умолчанию
        author_id: user?.uid,
        tags,
        source_url: url // Сохраняем исходный URL
      }

      const postId = await createPost(postData)

      toast({
        title: 'Успех',
        description: 'Публикация успешно создана',
      })

      // Сбрасываем форму
      setUrl('')
      setScrapedData(null)
      setTitle('')
      setContent('')
      setTags([])
      setActiveTab('url')
    } catch (error) {
      console.error('Error publishing post:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать публикацию',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Импорт новости</CardTitle>
        <CardDescription>Введите URL новости для импорта и публикации</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="preview" disabled={!scrapedData}>Предпросмотр</TabsTrigger>
            <TabsTrigger value="edit" disabled={!scrapedData}>Редактирование</TabsTrigger>
          </TabsList>

          <TabsContent value="url">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="url" className="text-sm font-medium">URL новости</label>
                <Input
                  id="url"
                  placeholder="https://example.com/news/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleScrape} disabled={loading} className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Импорт...
                  </>
                ) : 'Импортировать'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            {scrapedData && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                <div className="border rounded-md p-4 bg-background">
                  <MarkdownContent content={content} />
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('edit')}
                  >
                    Редактировать
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={loading}
                    className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Публикация...
                      </>
                    ) : 'Опубликовать'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="edit">
            {scrapedData && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">Заголовок</label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="content" className="text-sm font-medium">Содержание</label>
                  <MarkdownEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Теги</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-xs rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 h-4 w-4 inline-flex items-center justify-center"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Добавить тег"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        const input = e.currentTarget.previousSibling as HTMLInputElement;
                        handleAddTag(input.value);
                        input.value = '';
                      }}
                    >
                      Добавить
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('preview')}
                  >
                    Предпросмотр
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={loading}
                    className="bg-[hsl(var(--saas-purple))] hover:bg-[hsl(var(--saas-purple-dark))] text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Публикация...
                      </>
                    ) : 'Опубликовать'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
