'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, ThumbsUp, Eye, Pencil, ChevronLeft, ChevronRight, Paperclip } from "lucide-react"
import Link from "next/link"
import type { Post } from "@/types/database"
import { formatDate } from "@/lib/utils"
import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { useAuth } from "@/context/auth-context"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { DeletePostButton } from "@/components/delete-post-button"
import { usePaginatedPosts } from "@/lib/hooks/usePaginatedPosts"
import { Skeleton } from "@/components/ui/skeleton"
import { togglePinPost } from "@/lib/client-api"

interface PaginatedPostsTableProps {
  category?: string
  authorId?: string
  tag?: string
  pageSize?: number
  includeArchived?: boolean
}

export function PaginatedPostsTable({
  category,
  authorId,
  tag,
  pageSize = 10,
  includeArchived = false
}: PaginatedPostsTableProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisibleIds, setLastVisibleIds] = useState<string[]>([null]); // Первый элемент null для первой страницы

  // Получаем данные с пагинацией
  const {
    posts,
    loading,
    error,
    hasMore,
    loadMorePosts,
    refresh
  } = usePaginatedPosts({
    initialLimit: pageSize,
    category,
    authorId,
    tag,
    includeArchived
  });

  // Сбрасываем состояние пагинации при изменении категории, автора или тега
  useEffect(() => {
    setCurrentPage(1);
    setLastVisibleIds([null]);
    refresh();
  }, [category, authorId, tag, refresh]);

  // Обработчик для перехода на следующую страницу
  const handleNextPage = async () => {
    if (hasMore) {
      // Сохраняем текущий lastVisible для возможности возврата назад
      if (currentPage >= lastVisibleIds.length) {
        await loadMorePosts();
        setLastVisibleIds(prev => [...prev, posts[posts.length - 1]?.id]);
      } else {
        // Используем сохраненный lastVisible
        await loadMorePosts();
      }
      setCurrentPage(prev => prev + 1);
    }
  };

  // Обработчик для перехода на предыдущую страницу
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      // Используем сохраненный lastVisible для предыдущей страницы
      // Это потребует дополнительной логики в хуке usePaginatedPosts
      refresh(); // Временное решение - перезагружаем первую страницу
    }
  };

  // Проверка, имеет ли пользователь права учителя или админа
  const isTeacherOrAdmin = profile?.role === "teacher" || profile?.role === "admin";
  const canDelete = isTeacherOrAdmin;

  // Проверка, имеет ли пользователь права на редактирование (владелец, учитель или админ)
  const canEdit = (post: Post) => {
    if (!profile) return false;
    return profile.role === "teacher" || profile.role === "admin" || post.author?.username === profile.username;
  };

  // Функция для закрепления/открепления поста
  const handleTogglePin = async (postId: string) => {
    try {
      const success = await togglePinPost(postId);
      if (success) {
        // Обновляем список после изменения статуса закрепления
        refresh();
        toast({
          title: 'Статус закрепления изменен',
          description: 'Статус публикации успешно изменен',
        });
      }
    } catch (error) {
      console.error('Ошибка при изменении статуса закрепления:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус закрепления публикации',
        variant: 'destructive',
      });
    }
  };

  // Если произошла ошибка
  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Ошибка при загрузке публикаций: {error.message}</p>
      </div>
    );
  }

  // Если данные загружаются и нет постов
  if (loading && posts.length === 0) {
    return <PostsTableSkeleton pageSize={pageSize} canDelete={canDelete} />;
  }

  // Если нет публикаций
  if (!loading && posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Публикации не найдены</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                        className="text-xs bg-[hsl(var(--saas-purple)/0.1)] text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.2)] dark:bg-[hsl(var(--saas-purple)/0.2)] dark:text-[hsl(var(--saas-purple-light))] dark:border-[hsl(var(--saas-purple)/0.3)]"
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
                      {isTeacherOrAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${post.pinned ? 'text-[hsl(var(--saas-purple))]' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation(); // Предотвращаем всплытие события
                            handleTogglePin(post.id);
                          }}
                          title={post.pinned ? 'Открепить' : 'Закрепить'}
                        >
                          <Paperclip className={`h-4 w-4 ${post.pinned ? 'text-[hsl(var(--saas-purple))]' : 'text-gray-400'}`} />
                        </Button>
                      )}
                      <DeletePostButton
                        postId={post.id}
                        onSuccess={() => {
                          // Обновляем список после удаления
                          refresh();
                          toast({
                            title: "Публикация удалена",
                            description: "Публикация была успешно удалена",
                          });
                        }}
                      />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Страница {currentPage}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1 || loading}
            className="h-8 px-3"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Туда
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasMore || loading}
            className="h-8 px-3"
          >
            Сюда
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Индикатор загрузки */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-pulse flex space-x-2">
            <div className="h-2 w-2 bg-[hsl(var(--saas-purple))] rounded-full"></div>
            <div className="h-2 w-2 bg-[hsl(var(--saas-purple))] rounded-full"></div>
            <div className="h-2 w-2 bg-[hsl(var(--saas-purple))] rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Скелетон для таблицы публикаций
function PostsTableSkeleton({ pageSize = 10, canDelete = false }) {
  return (
    <div className="space-y-4">
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
            {Array.from({ length: pageSize }).map((_, index) => (
              <tr key={index} className="border-b border-border">
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex justify-center">
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </td>
                <td className="py-3 px-4">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </td>
                {canDelete && (
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация (скелетон) */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
