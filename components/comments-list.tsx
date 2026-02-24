"use client";

import { Reply, ThumbsUp, Trash2 } from "lucide-react";
import { memo, useCallback, useEffect, useOptimistic, useState, useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import {
  deleteComment,
  getCommentsByPostId,
  hasUserLikedComment,
  likeComment,
  unlikeComment,
} from "@/lib/supabase-comments";
import type { Comment } from "@/types/database";
import { CommentForm } from "./comment-form";

interface CommentsListProps {
  postId: string;
}

function CommentsListComponent({ postId }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, profile } = useAuth();
  const [isPending, startTransition] = useTransition();

  // Используем useOptimistic для оптимистичных обновлений комментариев
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: Comment) => {
      if (newComment.parent_id) {
        // Если это ответ, добавляем к родительскому комментарию
        return state.map((comment) => {
          if (comment.id === newComment.parent_id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment],
            };
          }
          return comment;
        });
      }
      // Если это новый комментарий, добавляем в начало
      return [newComment, ...state];
    }
  );

  const userId = user?.id;

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedComments = await getCommentsByPostId(postId);
      setComments(fetchedComments);

      // Загружаем информацию о лайках пользователя
      if (userId) {
        const likedSet = new Set<string>();
        for (const comment of fetchedComments) {
          const checkLiked = async (c: Comment) => {
            const isLiked = await hasUserLikedComment(c.id, userId);
            if (isLiked) {
              likedSet.add(c.id);
            }
            if (c.replies) {
              for (const reply of c.replies) {
                await checkLiked(reply);
              }
            }
          };
          await checkLiked(comment);
        }
        setLikedComments(likedSet);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Ошибка", {
        description: "Не удалось загрузить комментарии",
      });
    } finally {
      setLoading(false);
    }
  }, [postId, userId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Проверка прав на удаление комментария (мемоизировано)
  const canDeleteComment = useCallback(
    (comment: Comment) => {
      if (!user || !profile) return false;

      // Автор комментария может удалить свой комментарий
      const isAuthor = comment.author.username === profile.username;

      // Учитель или админ может удалить любой комментарий
      const isTeacherOrAdmin = profile.role === "teacher" || profile.role === "admin";

      return isAuthor || isTeacherOrAdmin;
    },
    [user, profile]
  );

  // Подтверждение удаления комментария
  const confirmDelete = useCallback(async () => {
    if (!commentToDelete) return;

    setIsDeleting(true);

    try {
      const success = await deleteComment(commentToDelete);

      if (success) {
        toast.success("Успешно", {
          description: "Комментарий был удален",
        });
        startTransition(() => {
          fetchComments();
        });
      } else {
        toast.error("Ошибка", {
          description: "Не удалось удалить комментарий",
        });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Ошибка", {
        description: "Произошла ошибка при удалении комментария",
      });
    } finally {
      setIsDeleting(false);
      setCommentToDelete(null);
    }
  }, [commentToDelete, fetchComments]);

  const handleLike = useCallback(
    async (commentId: string) => {
      if (!user) {
        toast.error("Ошибка", {
          description: "Вы должны быть авторизованы для отправки лайков",
        });
        return;
      }

      try {
        const isLiked = likedComments.has(commentId);

        // Оптимистичное обновление UI
        setLikedComments((prev) => {
          const newSet = new Set(prev);
          if (isLiked) {
            newSet.delete(commentId);
          } else {
            newSet.add(commentId);
          }
          return newSet;
        });

        // Обновляем счетчик лайков оптимистично
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likesCount: (comment.likesCount || 0) + (isLiked ? -1 : 1),
              };
            }
            // Проверяем ответы
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        likesCount: (reply.likesCount || 0) + (isLiked ? -1 : 1),
                      }
                    : reply
                ),
              };
            }
            return comment;
          })
        );

        // Выполняем действие в фоне
        startTransition(async () => {
          if (isLiked) {
            await unlikeComment(commentId, user.id);
          } else {
            await likeComment(commentId, user.id);
          }
          // Обновляем данные после успешного действия
          fetchComments();
        });
      } catch (error) {
        console.error("Error liking/unliking comment:", error);
        toast.error("Ошибка", {
          description: "Не удалось обработать лайк",
        });
        // Откатываем оптимистичное обновление
        fetchComments();
      }
    },
    [user, likedComments, fetchComments]
  );

  // Мемоизируем функцию рендеринга комментария
  const renderComment = useCallback(
    (comment: Comment, isReply = false) => {
      const isLiked = likedComments.has(comment.id);
      const formattedDate = new Date(comment.created_at).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });

      return (
        <div key={comment.id} className={`${isReply ? "ml-12 mt-4" : "mb-6"} rounded-lg p-3`}>
          <div className="flex items-start gap-4">
            <SimpleAvatar username={comment.author.username} size="md" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.author.username}</span>
                <Badge variant="outline" className="text-xs">
                  {comment.author.role === "teacher"
                    ? "Учитель"
                    : comment.author.role === "admin"
                      ? "Администратор"
                      : "Ученик"}
                </Badge>
                <span className="text-xs text-muted-foreground">{formattedDate}</span>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap break-words">{comment.content}</p>
              <div className="flex items-center gap-4 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${isLiked ? "text-primary" : ""}`}
                  onClick={() => handleLike(comment.id)}
                  disabled={isPending}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  <span className="text-xs">{comment.likesCount || 0}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  <span className="text-xs">Ответить</span>
                </Button>
                {canDeleteComment(comment) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    onClick={() => setCommentToDelete(comment.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    <span className="text-xs">Удалить</span>
                  </Button>
                )}
              </div>

              {replyingTo === comment.id && (
                <div className="mt-4">
                  <CommentForm
                    postId={postId}
                    parentId={comment.id}
                    onCommentAdded={() => {
                      setReplyingTo(null);
                      startTransition(() => {
                        fetchComments();
                      });
                    }}
                    onCancel={() => setReplyingTo(null)}
                    placeholder="Напишите ответ..."
                  />
                </div>
              )}
            </div>
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">{comment.replies.map((reply) => renderComment(reply, true))}</div>
          )}
        </div>
      );
    },
    [likedComments, handleLike, canDeleteComment, replyingTo, postId, fetchComments, isPending]
  );

  // Используем оптимистичные комментарии для рендеринга
  const commentsToRender = optimisticComments;

  if (loading) {
    return (
      <div className="py-4 text-center">
        <Spinner className="h-5 w-5 mx-auto" />
        <p className="text-muted-foreground mt-2">Загрузка комментариев...</p>
      </div>
    );
  }

  return (
    <>
      <AlertDialog
        open={commentToDelete !== null}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление комментария</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот комментарий? Все ответы на него также будут
              удалены. Это действие нельзя отменить.
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

      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Комментарии</h3>
          <CommentForm
            postId={postId}
            onCommentAdded={() => {
              startTransition(() => {
                fetchComments();
              });
            }}
          />
        </div>

        {commentsToRender.length > 0 ? (
          <div className="space-y-4">
            {commentsToRender.map((comment) => renderComment(comment))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Комментариев пока нет. Будьте первым, кто оставит комментарий!
          </div>
        )}
      </div>
    </>
  );
}

// Мемоизируем компонент для предотвращения лишних ререндеров
export const CommentsList = memo(CommentsListComponent, (prevProps, nextProps) => {
  // Компонент перерендерится только если postId изменился
  return prevProps.postId === nextProps.postId;
});
