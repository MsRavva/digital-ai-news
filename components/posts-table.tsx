'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, ThumbsUp, Eye, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import type { Post } from "@/types/database"
import { formatDate } from "@/lib/utils"
import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { useAuth } from "@/context/auth-context"
import { deletePost } from "@/lib/client-api"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface PostsTableProps {
  posts: Post[]
}

export function PostsTable({ posts: initialPosts }: PostsTableProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isDeleting, setIsDeleting] = useState(false);

  // Обновляем локальное состояние при изменении пропсов
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Проверка, имеет ли пользователь права на удаление (учитель или админ)
  const canDelete = profile?.role === "teacher" || profile?.role === "admin";

  // Проверка, имеет ли пользователь права на редактирование (владелец, учитель или админ)
  const canEdit = (post: Post) => {
    if (!profile) return false;
    return profile.role === "teacher" || profile.role === "admin" || post.author?.username === profile.username;
  };

  // Обработчик удаления публикации
  const handleDelete = async (postId: string) => {
    if (!canDelete) return;

    setIsDeleting(true);
    try {
      const success = await deletePost(postId);

      if (success) {
        // Удаляем пост из локального состояния
        setPosts(posts.filter(post => post.id !== postId));

        toast({
          title: "Успешно",
          description: "Публикация была удалена",
          variant: "default"
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить публикацию",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении публикации:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении публикации",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  // Проверяем, что posts не undefined, не null и является массивом
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    console.log('Нет публикаций для отображения в таблице:', posts);
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
            {canDelete && (
              <th className="py-3 px-4 text-left font-medium text-muted-foreground">Действия</th>
            )}
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr
              key={post.id}
              className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => router.push(`/posts/${post.id}`)}
            >
              <td className="py-3 px-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <SimpleAvatar username={post.author?.username} />
                    <span className="font-medium text-sm whitespace-nowrap">{post.author?.username}</span>
                  </div>
                  <div className="flex justify-center">
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
                <div className="font-medium hover:text-[hsl(var(--saas-purple))] transition-colors">
                  {post.title}
                </div>
                <div className="text-muted-foreground text-sm line-clamp-1 mt-1">
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    {post.content.length > 100
                      ? post.content.substring(0, 100) + '...'
                      : post.content
                    }
                  </div>
                </div>
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
              {canDelete && (
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    {canEdit(post) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[hsl(var(--saas-purple))]"
                        onClick={(e) => {
                          e.stopPropagation(); // Предотвращаем всплытие события
                          router.push(`/edit/${post.id}`);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation(); // Предотвращаем всплытие события
                        handleDelete(post.id);
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
