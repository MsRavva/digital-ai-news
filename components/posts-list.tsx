import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ThumbsUp, Eye, MoreHorizontal, Trash2 } from "lucide-react"
import Link from "next/link"
import type { Post } from "@/types/database"
import { useAuth } from "@/context/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
// import { useState } from "react" - больше не используется

interface PostsListProps {
  posts: Post[]
}

export function PostsList({ posts }: PostsListProps) {
  const { profile } = useAuth();
  // Состояние для отслеживания наведения на карточку больше не используется
  // const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);

  // Проверка, имеет ли пользователь права на удаление (учитель или админ)
  const canDelete = profile?.role === "teacher" || profile?.role === "admin";

  if (!posts || posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Публикации не найдены</p>
      </div>
    )
  }

  const handleDelete = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Здесь будет логика удаления поста
    console.log(`Удаление поста с ID: ${postId}`);
    // В реальном приложении здесь будет вызов API для удаления поста
  }

  return (
    <div className="card-grid">
      {posts.map((post) => (
        <div key={post.id} className="relative">
          <Link href={`/posts/${post.id}`}>
            <div className="post-card p-6 hover:border-[hsl(var(--saas-purple)/0.5)] transition-all duration-200 rounded-lg w-full">
              <div className="w-full">
                <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 mr-2">
                      <SimpleAvatar username={post.author?.username} size="md" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[hsl(var(--saas-purple-dark))] dark:text-[hsl(var(--saas-purple-light))]">
                        {post.author?.username}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-[hsl(var(--saas-purple)/0.1)] text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.2)] dark:bg-[hsl(var(--saas-purple)/0.2)] dark:text-[hsl(var(--saas-purple-light))] dark:border-[hsl(var(--saas-purple)/0.3)]"
                      >
                        {post.author?.role === "teacher" ? "Учитель" : "Ученик"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                      <button className="text-muted-foreground hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={(e) => handleDelete(e, post.id)}
                          className="text-red-500 hover:text-red-700 focus:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="w-full">
                  <h3 className="text-xl font-semibold mt-3 group-hover:text-[hsl(var(--saas-purple))] transition-colors duration-200 w-full">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 line-clamp-2 w-full">
                    {post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4 w-full">
                    {post.tags?.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground w-full">
                    <div className="flex items-center gap-1.5 hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.commentsCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{post.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                      <Eye className="h-4 w-4" />
                      <span>{post.viewsCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  )
}
