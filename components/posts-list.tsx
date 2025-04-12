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
    <div className="space-y-4">
      {posts.map((post) => (
        <Link href={`/posts/${post.id}`} key={post.id}>
          <div className="saas-card p-5 hover:border-saas-purple-light transition-colors">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt={post.author?.username || ""} />
                <AvatarFallback className="bg-saas-purple text-white">
                  {post.author?.username.substring(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="font-medium">{post.author?.username}</span>
                    <Badge
                      variant="outline"
                      className="ml-2 bg-saas-purple-bg text-saas-purple border-saas-purple-light dark:bg-[#1e293b] dark:text-saas-purple-light dark:border-[#374151]"
                    >
                      {post.author?.role === "teacher" ? "Учитель" : "Ученик"}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(post.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                  <button className="text-muted-foreground hover:text-saas-purple">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold mt-2">{post.title}</h3>
                <p className="text-muted-foreground mt-1">
                  {post.content.length > 150 ? post.content.substring(0, 150) + "..." : post.content}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-saas-purple-bg text-saas-purple border-none dark:bg-[#1e293b] dark:text-saas-purple-light"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.commentsCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
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
