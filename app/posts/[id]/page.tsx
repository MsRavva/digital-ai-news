'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { CommentsList } from "@/components/comments-list"
import { CommentForm } from "@/components/comment-form"
import { MessageSquare, ThumbsUp, Eye, Share2, Bookmark } from "lucide-react"
import { useEffect, useState } from 'react'
import React from 'react'
import { getPostById } from '@/lib/client-api'
import { Post } from '@/types/database'

// Функция для обрезки длинных строк
const truncateString = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

// Функция для обработки ссылок в HTML-контенте
const processHtmlContent = (content: string) => {
  // Обрезаем длинные ссылки в тексте ссылок
  return content.replace(/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g, (match, url, text) => {
    // Если текст ссылки слишком длинный, обрезаем его
    const displayText = text.length > 60 ? truncateString(text, 60) : text;
    // Добавляем класс для стилизации и обрезки ссылок
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="post-link">${displayText}</a>`;
  });
};

export default function PostPage({ params }: { params: { id: string } }) {
  // Используем React.use() для разворачивания Promise
  const unwrappedParams = React.use(params)
  const postId = unwrappedParams.id

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostById(postId)
        setPost(postData)
      } catch (error) {
        console.error('Ошибка при загрузке публикации:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="flex h-16 items-center px-4 sm:px-6">
            <MainNav />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">Загрузка публикации...</p>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="flex h-16 items-center px-4 sm:px-6">
            <MainNav />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">Публикация не найдена</p>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Card className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10 avatar">
                    <AvatarImage src="/placeholder.svg" alt={post.author?.username || ""} />
                    <AvatarFallback className="avatar-fallback">
                      {(() => {
                        if (!post.author?.username) return "??";
                        const nameParts = post.author.username.split(' ');
                        if (nameParts.length >= 2) {
                          // Фамилия + Имя (первые буквы)
                          return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
                        } else {
                          // Если только одно слово, берем первые две буквы
                          return post.author.username.substring(0, 2).toUpperCase();
                        }
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{post.author?.username}</div>
                    <div className="flex items-center">
                      <Badge variant="outline">{post.author?.role === "teacher" ? "Учитель" : "Ученик"}</Badge>
                      <span className="text-sm text-muted-foreground ml-2">
                        {new Date(post.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="prose max-w-none">
                <p>{post.content}</p>
              </div>

              <div className="flex items-center space-x-6 mt-6">
                <Button variant="outline" className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.likesCount || 0}</span>
                </Button>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentsCount || 0} комментариев</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewsCount || 0} просмотров</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <h2 className="text-xl font-semibold mb-4">Комментарии</h2>
              <CommentForm />
              <div className="mt-6">
                <CommentsList postId={postId} />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
