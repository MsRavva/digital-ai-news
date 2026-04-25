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

export async function getPosts(
  category?: string,
  includeArchived = false,
  archivedOnly = false
): Promise<Post[]> {
  switch (getBackendProvider()) {
    case "appwrite":
      return getJson<Post[]>(
        `/api/appwrite/posts?${new URLSearchParams({
          ...(category ? { category } : {}),
          includeArchived: String(includeArchived),
          archivedOnly: String(archivedOnly),
        }).toString()}`
      );
    default:
      return getSupabasePosts(category, includeArchived, archivedOnly);
  }
}

export async function getPostById(postId: string): Promise<Post | null> {
  switch (getBackendProvider()) {
    case "appwrite":
      try {
        return await getJson<Post | null>(`/api/appwrite/posts/${postId}`);
      } catch {
        return null;
      }
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
      return sendJson<{ postId: string | null }>("/api/appwrite/posts/write", {
        method: "POST",
        body: JSON.stringify(data),
      }).then((result) => result.postId);
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
      return sendJson<{ success: boolean }>(`/api/appwrite/posts/${data.id}/write`, {
        method: "PUT",
        body: JSON.stringify(data),
      }).then((result) => result.success);
    default:
      return updateSupabasePost(data);
  }
}

export async function recordView(postId: string, userId: string): Promise<void> {
  switch (getBackendProvider()) {
    case "appwrite":
      await sendJson<{ success: boolean }>(`/api/appwrite/posts/${postId}/write`, {
        method: "PATCH",
        body: JSON.stringify({ action: "recordView", userId }),
      });
      return;
    default:
      return recordSupabaseView(postId, userId);
  }
}

export async function togglePinPost(postId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ success: boolean }>(`/api/appwrite/posts/${postId}/write`, {
        method: "PATCH",
        body: JSON.stringify({ action: "togglePin" }),
      }).then((result) => result.success);
    default:
      return togglePinSupabasePost(postId);
  }
}

export async function archivePost(postId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ success: boolean }>(`/api/appwrite/posts/${postId}/write`, {
        method: "PATCH",
        body: JSON.stringify({ action: "archive" }),
      }).then((result) => result.success);
    default:
      return archiveSupabasePost(postId);
  }
}

export async function unarchivePost(postId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ success: boolean }>(`/api/appwrite/posts/${postId}/write`, {
        method: "PATCH",
        body: JSON.stringify({ action: "unarchive" }),
      }).then((result) => result.success);
    default:
      return unarchiveSupabasePost(postId);
  }
}

export async function deletePost(postId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ success: boolean }>(`/api/appwrite/posts/${postId}/write`, {
        method: "DELETE",
      }).then((result) => result.success);
    default:
      return deleteSupabasePost(postId);
  }
}

export async function likePost(postId: string, userId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ success: boolean }>(`/api/appwrite/posts/${postId}/write`, {
        method: "PATCH",
        body: JSON.stringify({ action: "like", userId }),
      }).then((result) => result.success);
    default:
      return likeSupabasePost(postId, userId);
  }
}

export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
  switch (getBackendProvider()) {
    case "appwrite":
      return sendJson<{ success: boolean }>(`/api/appwrite/posts/${postId}/write`, {
        method: "PATCH",
        body: JSON.stringify({ action: "hasLiked", userId }),
      }).then((result) => result.success);
    default:
      return hasUserLikedSupabasePost(postId, userId);
  }
}
