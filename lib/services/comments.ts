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

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite comments read flow is not connected yet.");
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
      throw new Error("Appwrite comment create flow is not connected yet.");
    default:
      return addSupabaseComment(data);
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite comment delete flow is not connected yet.");
    default:
      return deleteSupabaseComment(commentId);
  }
}

export async function likeComment(commentId: string, userId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite comment-like flow is not connected yet.");
    default:
      return likeSupabaseComment(commentId, userId);
  }
}

export async function unlikeComment(commentId: string, userId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite comment-unlike flow is not connected yet.");
    default:
      return unlikeSupabaseComment(commentId, userId);
  }
}

export async function hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite comment-like-check flow is not connected yet.");
    default:
      return hasUserLikedSupabaseComment(commentId, userId);
  }
}
