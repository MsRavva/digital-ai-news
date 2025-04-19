'use client'

import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ThumbsUp, Eye, MoreHorizontal, Pencil } from "lucide-react"
import Link from "next/link"
import type { Post } from "@/types/database"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { DeletePostButton } from "@/components/delete-post-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const { profile } = useAuth();
  const router = useRouter();

  // Проверка, имеет ли пользователь права на удаление (учитель или админ)
  const canDelete = profile?.role === "teacher" || profile?.role === "admin";

  // Проверка, имеет ли пользователь права на редактирование (владелец, учитель или админ)
  const canEdit = () => {
    if (!profile) return false;
    return profile.role === "teacher" || profile.role === "admin" || post.author?.username === profile.username;
  };

  return (
    <div className="relative">
      <Link href={`/posts/${post.id}`}>
        <div className="post-card p-6 hover:border-[hsl(var(--saas-purple)/0.5)] transition-all duration-200 rounded-lg w-full">
          <div className="w-full">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 mr-1">
                    <SimpleAvatar username={post.author?.username} size="md" />
                  </div>
                  <span className="font-medium text-[hsl(var(--saas-purple-dark))] dark:text-[hsl(var(--saas-purple-light))] whitespace-nowrap">
                    {post.author?.username}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-1">
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
                  {canEdit() && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/edit/${post.id}`);
                      }}
                      className="text-[hsl(var(--saas-purple))] hover:text-[hsl(var(--saas-purple-dark))] focus:text-[hsl(var(--saas-purple-dark))] cursor-pointer"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-red-500 hover:text-red-700 focus:text-red-700 cursor-pointer p-0"
                    >
                      <DeletePostButton
                        postId={post.id}
                        variant="ghost"
                        showIcon={true}
                        showText={true}
                        className="w-full justify-start px-2 py-1.5 text-red-500 hover:text-red-700"
                      />
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="w-full">
              <h3 className="text-xl font-semibold mt-3 group-hover:text-[hsl(var(--saas-purple))] transition-colors duration-200 w-full">
                {post.title}
              </h3>
              <div className="text-muted-foreground mt-2 line-clamp-2 w-full">
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  {post.content.length > 150
                    ? post.content.substring(0, 150) + '...'
                    : post.content
                  }
                </div>
              </div>
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
  )
}
