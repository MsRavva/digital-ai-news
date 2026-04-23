import { getBackendProvider } from "@/lib/backend-provider";
import {
  archivePost as archiveSupabasePost,
  deletePost as deleteSupabasePost,
  hasUserLikedPost as hasUserLikedSupabasePost,
  likePost as likeSupabasePost,
  togglePinPost as togglePinSupabasePost,
  unarchivePost as unarchiveSupabasePost,
} from "@/lib/supabase-post-actions";
import { getPosts as getSupabasePosts } from "@/lib/supabase-posts";
import {
  createPost as createSupabasePost,
  getPostById as getSupabasePostById,
  recordView as recordSupabaseView,
  updatePost as updateSupabasePost,
} from "@/lib/supabase-posts-api";
import type { Post } from "@/types/database";

export async function getPosts(
  category?: string,
  includeArchived = false,
  archivedOnly = false
): Promise<Post[]> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite posts read flow is not connected yet.");
    default:
      return getSupabasePosts(category, includeArchived, archivedOnly);
  }
}

export async function getPostById(postId: string): Promise<Post | null> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite post-by-id flow is not connected yet.");
    default:
      return getSupabasePostById(postId);
  }
}

export async function createPost(data: {
  title: string;
  content: string;
  category: string;
  author_id: string;
  tags: string[];
  source_url?: string;
}): Promise<string | null> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite post creation flow is not connected yet.");
    default:
      return createSupabasePost(data);
  }
}

export async function updatePost(data: {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite post update flow is not connected yet.");
    default:
      return updateSupabasePost(data);
  }
}

export async function recordView(postId: string, userId: string): Promise<void> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite post view flow is not connected yet.");
    default:
      return recordSupabaseView(postId, userId);
  }
}

export async function togglePinPost(postId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite pin flow is not connected yet.");
    default:
      return togglePinSupabasePost(postId);
  }
}

export async function archivePost(postId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite archive flow is not connected yet.");
    default:
      return archiveSupabasePost(postId);
  }
}

export async function unarchivePost(postId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite unarchive flow is not connected yet.");
    default:
      return unarchiveSupabasePost(postId);
  }
}

export async function deletePost(postId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite delete-post flow is not connected yet.");
    default:
      return deleteSupabasePost(postId);
  }
}

export async function likePost(postId: string, userId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite like-post flow is not connected yet.");
    default:
      return likeSupabasePost(postId, userId);
  }
}

export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      throw new Error("Appwrite like-check flow is not connected yet.");
    default:
      return hasUserLikedSupabasePost(postId, userId);
  }
}
