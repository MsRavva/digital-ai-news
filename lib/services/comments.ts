import { getBackendProvider } from "@/lib/backend-provider";
import {
  addComment as addSupabaseComment,
  deleteComment as deleteSupabaseComment,
  getCommentsByPostId as getSupabaseCommentsByPostId,
  hasUserLikedComment as hasUserLikedSupabaseComment,
  likeComment as likeSupabaseComment,
  unlikeComment as unlikeSupabaseComment,
} from "@/lib/supabase-comments";
import type { Comment } from "@/types/database";

async function getJson<T>(input: string): Promise<T> {
  const response = await fetch(input, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function sendJson<T>(input: string, init: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  switch (getBackendProvider()) {
    case "appwrite":
      return getJson<Comment[]>(`/api/appwrite/posts/${postId}/comments`);
    default:
      return getSupabaseCommentsByPostId(postId);
  }
}

export async function addComment(data: {
  content: string;
  post_id: string;
  author_id: string;
  parent_id?: string;
}): Promise<string | null> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ commentId: string | null }>("/api/appwrite/comments", {
        method: "POST",
        body: JSON.stringify(data),
      }).then((result) => result.commentId);
    default:
      return addSupabaseComment(data);
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ success: boolean }>(`/api/appwrite/comments/${commentId}`, {
        method: "DELETE",
      }).then((result) => result.success);
    default:
      return deleteSupabaseComment(commentId);
  }
}

export async function likeComment(commentId: string, userId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ success: boolean }>(`/api/appwrite/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "like", userId }),
      }).then((result) => result.success);
    default:
      return likeSupabaseComment(commentId, userId);
  }
}

export async function unlikeComment(commentId: string, userId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ success: boolean }>(`/api/appwrite/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "unlike", userId }),
      }).then((result) => result.success);
    default:
      return unlikeSupabaseComment(commentId, userId);
  }
}

export async function hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ success: boolean }>(`/api/appwrite/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "hasLiked", userId }),
      }).then((result) => result.success);
    default:
      return hasUserLikedSupabaseComment(commentId, userId);
  }
}
