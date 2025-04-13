'use client'

import { Badge } from "@/components/ui/badge"
import { MessageSquare, ThumbsUp, Eye } from "lucide-react"
import Link from "next/link"
import type { Post } from "@/types/database"
import { formatDate } from "@/lib/utils"
import { SimpleAvatar } from "@/components/ui/simple-avatar"

interface PostsTableProps {
  posts: Post[]
}

export function PostsTable({ posts }: PostsTableProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Публикации не найдены</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Автор</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Заголовок</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Дата</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Теги</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">Статистика</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center space-x-3">
                  <SimpleAvatar username={post.author?.username} />
                  <div>
                    <div className="font-medium text-sm">{post.author?.username}</div>
                    <Badge
                      variant="outline"
                      className="text-xs bg-[hsl(var(--saas-purple)/0.1)] text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.2)]"
                    >
                      {post.author?.role === "teacher" ? "Учитель" : "Ученик"}
                    </Badge>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <Link href={`/posts/${post.id}`} className="font-medium hover:text-[hsl(var(--saas-purple))] transition-colors">
                  {post.title}
                </Link>
                <p className="text-muted-foreground text-sm line-clamp-1 mt-1">
                  {post.content.length > 100 ? post.content.substring(0, 100) + "..." : post.content}
                </p>
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                {formatDate(post.created_at)}
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  {post.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag text-xs py-0.5 px-2">
                      {tag}
                    </span>
                  ))}
                  {post.tags && post.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{post.tags.length - 3}</span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{post.commentsCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{post.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{post.viewsCount}</span>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
