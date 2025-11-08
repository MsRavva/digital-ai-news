"use client"

import { DeletePostButton } from "@/components/delete-post-button"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { togglePinPost } from "@/lib/client-api"
import type { Post } from "@/types/database"
import {
  Eye,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pencil,
  ThumbsUp,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const { profile } = useAuth()
  const router = useRouter()

  // Проверка, имеет ли пользователь права учителя или админа
  const isTeacherOrAdmin =
    profile?.role === "teacher" || profile?.role === "admin"
  const canDelete = isTeacherOrAdmin
  const { toast } = useToast()

  // Проверка, имеет ли пользователь права на редактирование (владелец, учитель или админ)
  const canEdit = () => {
    if (!profile) return false
    return (
      profile.role === "teacher" ||
      profile.role === "admin" ||
      post.author?.username === profile.username
    )
  }

  // Функция для закрепления/открепления поста
  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const success = await togglePinPost(post.id)
      if (success) {
        toast({
          title: post.pinned
            ? "Публикация откреплена"
            : "Публикация закреплена",
          description: "Статус публикации успешно изменен",
        })
        // Перезагрузка страницы для обновления списка публикаций
        router.refresh()
      }
    } catch (error) {
      console.error("Ошибка при изменении статуса закрепления:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус закрепления публикации",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="relative h-full">
      <Link href={`/posts/${post.id}`}>
        <div className="post-card p-6 hover:border-primary/50 transition-all duration-200 rounded-lg w-full h-full flex flex-col bg-card shadow-sm border border-border hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between w-full mb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 mr-1">
                  <SimpleAvatar username={post.author?.username} size="md" />
                </div>
                <span className="font-medium text-primary whitespace-nowrap">
                  {post.author?.username}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-1">
                <Badge
                  variant="outline"
                  className="bg-white dark:bg-[hsl(var(--saas-purple)/0.1)] text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.3)] dark:border-[hsl(var(--saas-purple)/0.5)] shadow-sm dark:shadow-[hsl(var(--saas-purple)/0.2)]"
                >
                  {post.author?.role === "teacher" ? "Учитель" : "Ученик"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                onClick={(e) => e.preventDefault()}
              >
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit() && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      router.push(`/edit/${post.id}`)
                    }}
                    className="text-primary hover:text-primary/80 focus:text-primary/80 cursor-pointer"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Редактировать
                  </DropdownMenuItem>
                )}
                {isTeacherOrAdmin && (
                  <DropdownMenuItem
                    onClick={handleTogglePin}
                    className={cn(
                      "cursor-pointer",
                      post.pinned ? "text-primary" : ""
                    )}
                  >
                    <Paperclip
                      className={cn(
                        "mr-2 h-4 w-4",
                        post.pinned ? "text-primary" : "text-gray-400"
                      )}
                    />
                    {post.pinned ? "Открепить" : "Закрепить"}
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-error hover:text-error/80 focus:text-error/80 cursor-pointer p-0"
                  >
                    <DeletePostButton
                      postId={post.id}
                      variant="ghost"
                      showIcon={true}
                      showText={true}
                      className="w-full justify-start px-2 py-1.5 text-error hover:text-error/80"
                    />
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex-grow">
            <h3 className="text-xl font-semibold mt-3 hover:text-primary transition-colors duration-200 w-full">
              {post.title}
            </h3>
            <div className="text-muted-foreground mt-2 line-clamp-2 w-full">
              <MarkdownRenderer content={post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content} className="prose dark:prose-invert prose-sm max-w-none text-muted-foreground" />
            </div>
          </div>
          <div className="flex justify-between items-end mt-4 w-full">
            <div className="flex flex-wrap gap-2">
              {post.tags?.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline"
                  className="bg-white dark:bg-[hsl(var(--saas-purple)/0.1)] text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.3)] dark:border-[hsl(var(--saas-purple)/0.5)] shadow-sm dark:shadow-[hsl(var(--saas-purple)/0.2)]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 hover:text-primary transition-colors duration-200">
                <MessageSquare className="h-4 w-4" />
                <span>{post.commentsCount}</span>
              </div>
              <div className="flex items-center gap-1 hover:text-primary transition-colors duration-200">
                <ThumbsUp className="h-4 w-4" />
                <span>{post.likesCount}</span>
              </div>
              <div className="flex items-center gap-1 hover:text-primary transition-colors duration-200">
                <Eye className="h-4 w-4" />
                <span>{post.viewsCount}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
