"use client";

import {
  Archive,
  ArchiveRestore,
  Eye,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SimpleAvatar } from "@/components/simple-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { archivePost, deletePost, togglePinPost, unarchivePost } from "@/lib/supabase-post-actions";
import { getPosts } from "@/lib/supabase-posts";
import { cn } from "@/lib/utils";
import type { Post } from "@/types/database";

interface PostsBentoGridProps {
  category?: string;
  archivedOnly?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function PostsBentoGrid({
  category,
  archivedOnly = false,
  searchQuery = "",
  onSearchChange,
}: PostsBentoGridProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postIdToDelete, setPostIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuth();

  const isTeacherOrAdmin =
    !authLoading && (profile?.role === "teacher" || profile?.role === "admin");

  const canEdit = (post: Post) => {
    if (authLoading || !profile) return false;
    return (
      profile.role === "teacher" ||
      profile.role === "admin" ||
      post.author?.username === profile.username
    );
  };

  const canDelete = (post: Post) => {
    if (authLoading || !profile) {
      return false;
    }
    return profile.role === "admin" || profile.role === "teacher";
  };

  // Функция загрузки публикаций
  const loadPosts = useCallback(async () => {
    // Не загружаем посты, если пользователь не авторизован
    if (authLoading || !profile) {
      return;
    }

    setLoading(true);
    try {
      // Используем category из пропа напрямую
      const categoryToUse = category && category !== "all" ? category : undefined;
      const fetchedPosts = await getPosts(categoryToUse, archivedOnly, archivedOnly);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  }, [category, archivedOnly, authLoading, profile?.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Фильтрация постов по searchQuery
  const filteredPosts = searchQuery
    ? posts.filter((post) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        // Поиск в заголовке
        const titleMatch = post.title.toLowerCase().includes(query);

        // Поиск в содержимом
        const contentMatch = post.content.toLowerCase().includes(query);

        // Поиск по тегам - точное совпадение или подстрока
        const tagsMatch =
          post.tags?.some((tag) => {
            const tagLower = tag.toLowerCase();
            return tagLower === query || tagLower.includes(query);
          }) || false;

        return titleMatch || contentMatch || tagsMatch;
      })
    : posts;

  // Группируем посты по 2 в строке
  const groupedPosts: Post[][] = [];
  for (let i = 0; i < filteredPosts.length; i += 2) {
    groupedPosts.push(filteredPosts.slice(i, i + 2));
  }

  const confirmDelete = async () => {
    if (!postIdToDelete) return;

    setIsDeleting(true);

    try {
      const success = await deletePost(postIdToDelete);
      if (success) {
        setPosts(posts.filter((p) => p.id !== postIdToDelete));
        toast.success("Публикация удалена");
      } else {
        toast.error("Не удалось удалить публикацию");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Произошла ошибка");
    } finally {
      setIsDeleting(false);
      setPostIdToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-4">
        {Array.from({ length: 3 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={cn(
              "grid grid-cols-1 gap-4 w-full",
              rowIndex === 0 && "md:grid-cols-[1.8fr_1.2fr]",
              rowIndex === 1 && "md:grid-cols-2",
              rowIndex === 2 && "md:grid-cols-[1.2fr_1.8fr]"
            )}
          >
            {Array.from({ length: 2 }).map((_, cardIndex) => (
              <BentoCard
                key={`${rowIndex}-${cardIndex}`}
                header={
                  <div className="flex items-start justify-between w-full mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                  </div>
                }
                title={<Skeleton className="h-7 w-3/4 mb-4" />}
                description={
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex-1 min-h-0 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t flex-shrink-0 mt-auto">
                      <div className="flex flex-wrap gap-1">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    </div>
                  </div>
                }
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const handleTagClick = (tag: string) => {
    onSearchChange?.(tag);
  };

  return (
    <>
      <AlertDialog
        open={postIdToDelete !== null}
        onOpenChange={(open) => !open && setPostIdToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление публикации</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить эту публикацию? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="w-full p-8 text-center">
            <p className="text-muted-foreground">Публикации не найдены</p>
          </div>
        ) : (
          <>
            {groupedPosts.map((rowPosts, rowIndex) => {
              const pattern = rowIndex % 3;

              return (
                <div
                  key={rowIndex}
                  className={cn(
                    "grid grid-cols-1 gap-4 w-full",
                    pattern === 0 && "md:grid-cols-[1.8fr_1.2fr]",
                    pattern === 1 && "md:grid-cols-2",
                    pattern === 2 && "md:grid-cols-[1.2fr_1.8fr]"
                  )}
                >
                  {rowPosts.map((post, cardIndex) => {
                    const handleEdit = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/edit/${post.id}`);
                    };

                    const handleTogglePin = async (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const success = await togglePinPost(post.id);
                        if (success) {
                          setPosts(
                            posts.map((p) => (p.id === post.id ? { ...p, pinned: !p.pinned } : p))
                          );
                          toast.success(
                            !post.pinned ? "Публикация закреплена" : "Публикация откреплена"
                          );
                        }
                      } catch (error) {
                        console.error("Error toggling pin:", error);
                        toast.error("Произошла ошибка");
                      }
                    };

                    const handleToggleArchive = async (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        const success = post.archived
                          ? await unarchivePost(post.id)
                          : await archivePost(post.id);
                        if (success) {
                          toast.success(
                            post.archived
                              ? "Публикация восстановлена из архива"
                              : "Публикация архивирована"
                          );
                          // Перезагружаем посты после успешного архивирования
                          await loadPosts();
                        }
                      } catch (error) {
                        console.error("Error toggling archive:", error);
                        toast.error("Произошла ошибка");
                      }
                    };

                    const handleDelete = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPostIdToDelete(post.id);
                    };

                    const handleCardClick = (e: React.MouseEvent) => {
                      // Если клик не был остановлен (stopPropagation), открываем пост
                      // Клики на контент, заголовок, header и футер уже остановлены через stopPropagation
                      router.push(`/posts/${post.id}`);
                    };

                    return (
                      <BentoCard
                        key={post.id}
                        onClick={handleCardClick}
                        header={
                          <div
                            className="flex items-start justify-between w-full mb-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <SimpleAvatar username={post.author?.username} size="sm" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">
                                  {post.author?.username}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="w-fit text-xs">
                                    {post.author?.role === "teacher"
                                      ? "Учитель"
                                      : post.author?.role === "admin"
                                        ? "Администратор"
                                        : "Ученик"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(post.created_at).toLocaleDateString("ru-RU", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {post.pinned && <Paperclip className="h-4 w-4 text-primary" />}
                              {(canEdit(post) || isTeacherOrAdmin || canDelete(post)) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <button
                                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                      onClick={(e) => e.preventDefault()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {canEdit(post) && (
                                      <DropdownMenuItem onClick={handleEdit}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Редактировать
                                      </DropdownMenuItem>
                                    )}
                                    {isTeacherOrAdmin && (
                                      <>
                                        <DropdownMenuItem onClick={handleTogglePin}>
                                          <Paperclip
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              post.pinned ? "text-primary" : ""
                                            )}
                                          />
                                          {post.pinned ? "Открепить" : "Закрепить"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleToggleArchive}>
                                          {post.archived ? (
                                            <>
                                              <ArchiveRestore className="mr-2 h-4 w-4" />
                                              Восстановить из архива
                                            </>
                                          ) : (
                                            <>
                                              <Archive className="mr-2 h-4 w-4" />
                                              Архивировать
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {canDelete(post) && (
                                      <DropdownMenuItem
                                        onClick={handleDelete}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Удалить
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        }
                        title={
                          <h3 className="font-bold text-xl mb-0 mt-0 line-clamp-3 group-hover/bento:text-primary transition-colors">
                            {post.title}
                          </h3>
                        }
                        description={
                          <div className="flex flex-col h-full justify-between">
                            <div className="flex-1 min-h-0 relative overflow-hidden">
                              <div
                                className="absolute inset-0 overflow-y-auto overflow-x-hidden pb-4 bento-card-content bento-card-content-wrapper"
                                onClick={(e) => {
                                  // Останавливаем propagation только для обычного текста (p, li, и т.д.)
                                  // Код и ссылки уже останавливают propagation сами
                                  const target = e.target as HTMLElement;
                                  if (
                                    target.tagName === "P" ||
                                    target.tagName === "LI" ||
                                    target.tagName === "UL" ||
                                    target.tagName === "OL" ||
                                    target.tagName === "H1" ||
                                    target.tagName === "H2" ||
                                    target.tagName === "H3" ||
                                    target.tagName === "H4" ||
                                    target.tagName === "H5" ||
                                    target.tagName === "H6" ||
                                    (target.tagName === "SPAN" &&
                                      !target.closest("code") &&
                                      !target.closest("a")) ||
                                    (target.tagName === "DIV" &&
                                      !target.closest("pre") &&
                                      !target.closest("code") &&
                                      !target.closest("a"))
                                  ) {
                                    e.stopPropagation();
                                  }
                                }}
                              >
                                <MarkdownContent
                                  content={post.content}
                                  disableLinks={false}
                                  className="prose-sm prose-p:text-sm prose-p:mb-2 prose-headings:text-sm prose-headings:mb-0 prose-headings:mt-0 prose-h1:text-sm prose-h2:text-sm prose-h3:text-sm prose-ul:text-sm prose-ol:text-sm prose-li:text-sm"
                                />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-10 fade-gradient-light fade-gradient-dark" />
                            </div>
                            <div
                              className="flex items-center justify-between pt-4 border-t flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {post.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <Badge
                                      key={tagIndex}
                                      variant="secondary"
                                      className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTagClick(tag);
                                      }}
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {post.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{post.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{post.commentsCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>{post.likesCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{post.viewsCount || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
