import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ThumbsUp, Eye, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import type { Post } from "@/types/database"

interface PostsListProps {
  posts: Post[]
}

export function PostsList({ posts }: PostsListProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Публикации не найдены</p>
      </div>
    )
  }

  return (
    <div className="card-grid">
      {posts.map((post) => (
        <Link href={`/posts/${post.id}`} key={post.id}>
          <div className="post-card p-6 hover:border-[hsl(var(--saas-purple)/0.5)] transition-all duration-200 rounded-lg">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 avatar">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt={post.author?.username || ""} />
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
              <div className="flex-1">
                <div className="flex items-center justify-between">
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
                  <button className="text-muted-foreground hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
                <h3 className="text-xl font-semibold mt-3 group-hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                  {post.title}
                </h3>
                <p className="text-muted-foreground mt-2 line-clamp-2">
                  {post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags?.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
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
      ))}
    </div>
  )
}
