"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { addComment } from "@/lib/supabase-comments";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCommentAdded?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  postId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = "Напишите комментарий...",
}: CommentFormProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Ошибка", {
        description: "Вы должны быть авторизованы для отправки комментариев",
      });
      return;
    }

    if (!comment.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const commentData = {
        content: comment.trim(),
        post_id: postId,
        author_id: user.id,
        parent_id: parentId,
      };

      const commentId = await addComment(commentData);

      if (commentId) {
        setComment("");
        toast.success("Успех", {
          description: "Комментарий успешно добавлен",
        });

        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        throw new Error("Не удалось добавить комментарий");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Ошибка", {
        description: "Не удалось добавить комментарий",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder={placeholder}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[100px]"
        disabled={isSubmitting}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!comment.trim() || isSubmitting}>
          {isSubmitting ? "Отправка..." : "Отправить"}
        </Button>
      </div>
    </form>
  );
}
