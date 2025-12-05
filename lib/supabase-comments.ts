import type { Comment } from "@/types/database";
import { supabase } from "./supabase";

// Получение комментариев по ID поста
export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  try {
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select(
        `
        id,
        content,
        created_at,
        parent_id,
        author_id,
        profiles!comments_author_id_fkey (
          username,
          role
        )
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return [];
    }

    if (!commentsData || commentsData.length === 0) {
      return [];
    }

    // Получаем ID всех комментариев
    const commentIds = commentsData.map((c) => c.id);

    // Получаем лайки для всех комментариев
    const { data: likesData } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .in("comment_id", commentIds);

    // Подсчитываем лайки
    const likesMap = new Map<string, number>();
    likesData?.forEach((like) => {
      likesMap.set(like.comment_id, (likesMap.get(like.comment_id) || 0) + 1);
    });

    // Преобразуем комментарии в нужный формат
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    commentsData.forEach((commentData) => {
      // profiles может быть объектом или массивом в зависимости от запроса
      const profilesData = Array.isArray(commentData.profiles)
        ? commentData.profiles[0]
        : commentData.profiles;
      const author = profilesData as { username: string; role: string } | null | undefined;

      const comment: Comment = {
        id: commentData.id,
        content: commentData.content,
        author: {
          username: author?.username || "Unknown",
          role: author?.role || "student",
        },
        created_at: commentData.created_at,
        parent_id: commentData.parent_id || null,
        replies: [],
        likesCount: likesMap.get(commentData.id) || 0,
      };

      commentMap.set(commentData.id, comment);
    });

    // Строим дерево комментариев
    commentMap.forEach((comment) => {
      if (comment.parent_id) {
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment && parentComment.replies) {
          parentComment.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

// Добавление комментария
export async function addComment(data: {
  content: string;
  post_id: string;
  author_id: string;
  parent_id?: string;
}): Promise<string | null> {
  try {
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .insert({
        content: data.content,
        post_id: data.post_id,
        author_id: data.author_id,
        parent_id: data.parent_id || null,
      })
      .select("id")
      .single();

    if (commentError || !commentData) {
      console.error("Error adding comment:", commentError);
      return null;
    }

    return commentData.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    return null;
  }
}

// Рекурсивная функция для получения всех дочерних комментариев
async function getAllChildCommentIds(parentId: string, postId: string): Promise<string[]> {
  const childIds: string[] = [];

  // Находим прямых потомков
  const { data: childrenData } = await supabase
    .from("comments")
    .select("id")
    .eq("post_id", postId)
    .eq("parent_id", parentId);

  if (!childrenData || childrenData.length === 0) {
    return [];
  }

  // Добавляем ID прямых потомков
  const directChildIds = childrenData.map((c) => c.id);
  childIds.push(...directChildIds);

  // Рекурсивно находим потомков для каждого прямого потомка
  for (const childId of directChildIds) {
    const nestedChildIds = await getAllChildCommentIds(childId, postId);
    childIds.push(...nestedChildIds);
  }

  return childIds;
}

// Удаление комментария и всех его ответов
export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    // Получаем данные комментария для получения post_id
    const { data: commentData, error: fetchError } = await supabase
      .from("comments")
      .select("post_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !commentData) {
      console.error("Error fetching comment:", fetchError);
      return false;
    }

    const postId = commentData.post_id;

    // Находим все дочерние комментарии (рекурсивно)
    const childCommentIds = await getAllChildCommentIds(commentId, postId);

    // Добавляем текущий комментарий к списку для удаления
    const allCommentIds = [commentId, ...childCommentIds];

    // Удаляем все комментарии (каскадное удаление удалит связанные лайки)
    const { error: deleteError } = await supabase.from("comments").delete().in("id", allCommentIds);

    if (deleteError) {
      console.error("Error deleting comments:", deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    return false;
  }
}

// Лайк комментария
export async function likeComment(commentId: string, userId: string): Promise<boolean> {
  try {
    // Проверяем, не лайкнул ли пользователь этот комментарий ранее
    const { data: existingLike } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .single();

    if (existingLike) {
      // Пользователь уже лайкнул этот комментарий
      return false;
    }

    // Добавляем лайк
    const { error } = await supabase.from("comment_likes").insert({
      comment_id: commentId,
      user_id: userId,
    });

    if (error) {
      console.error("Error liking comment:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error liking comment:", error);
    return false;
  }
}

// Удаление лайка комментария
export async function unlikeComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error unliking comment:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error unliking comment:", error);
    return false;
  }
}

// Проверка, лайкнул ли пользователь комментарий
export async function hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 - no rows returned, это нормально
      console.error("Error checking like:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking if user liked comment:", error);
    return false;
  }
}
