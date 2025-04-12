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

export default function PostPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the post data based on the ID
  const post = {
    id: params.id,
    title: "Новые возможности GPT-4 для веб-разработки",
    content: `
      <p>Недавно OpenAI представила обновление для GPT-4, которое значительно расширяет возможности этой модели в контексте веб-разработки. В этой статье мы рассмотрим ключевые улучшения и как они могут быть использованы для оптимизации рабочего процесса.</p>
      
      <h2>Улучшенное понимание кода</h2>
      <p>Новая версия GPT-4 демонстрирует более глубокое понимание различных языков программирования и фреймворков. Это позволяет модели не только генерировать более качественный код, но и лучше анализировать существующие проекты, находить ошибки и предлагать оптимизации.</p>
      
      <h2>Интеграция с инструментами разработки</h2>
      <p>OpenAI также представила новые API, которые упрощают интеграцию GPT-4 с популярными IDE и инструментами разработки. Это открывает возможности для создания интеллектуальных ассистентов, которые могут помогать разработчикам прямо в процессе написания кода.</p>
      
      <h2>Генерация пользовательских интерфейсов</h2>
      <p>Одно из самых впечатляющих улучшений — способность GPT-4 генерировать код для пользовательских интерфейсов на основе текстовых описаний. Модель теперь может создавать более сложные и функциональные UI-компоненты для различных фреймворков, включая React, Vue и Angular.</p>
    `,
    author: {
      name: "Анна Смирнова",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "teacher",
    },
    date: "2023-11-15",
    tags: ["ИИ", "GPT-4", "Веб-разработка"],
    commentsCount: 12,
    likesCount: 45,
    viewsCount: 230,
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
                  <Avatar>
                    <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{post.author.name}</div>
                    <div className="flex items-center">
                      <Badge variant="outline">{post.author.role === "teacher" ? "Учитель" : "Ученик"}</Badge>
                      <span className="text-sm text-muted-foreground ml-2">
                        {new Date(post.date).toLocaleDateString("ru-RU")}
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
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

              <div className="flex items-center space-x-6 mt-6">
                <Button variant="outline" className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.likesCount}</span>
                </Button>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentsCount} комментариев</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewsCount} просмотров</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <h2 className="text-xl font-semibold mb-4">Комментарии</h2>
              <CommentForm />
              <div className="mt-6">
                <CommentsList postId={post.id} />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
