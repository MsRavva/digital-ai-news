import { getAppwritePostById } from "@/lib/appwrite/read";
import { getBackendProvider } from "@/lib/backend-provider";
import type { Post } from "@/types/database";

const DEFAULT_SITE_URL = "https://digital-ai-news.vercel.app";
const DEFAULT_DESCRIPTION = "Digital AI News Platform";
const DESCRIPTION_MAX_LENGTH = 180;

export function getSiteUrl(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : DEFAULT_SITE_URL);

  return rawUrl.replace(/\/$/, "");
}

export async function getPublicPostById(postId: string): Promise<Post | null> {
  try {
    switch (getBackendProvider()) {
      case "appwrite":
        return getAppwritePostById(postId);
      default: {
        const { getPostById } = await import("@/lib/supabase-posts-api");
        return getPostById(postId);
      }
    }
  } catch (error) {
    console.error("Error loading post metadata:", error);
    return null;
  }
}

export function getMarkdownPreviewText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[*_~`>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getPostDescription(post: Post): string {
  const text = getMarkdownPreviewText(post.content);

  if (!text) {
    return DEFAULT_DESCRIPTION;
  }

  if (text.length <= DESCRIPTION_MAX_LENGTH) {
    return text;
  }

  return `${text.slice(0, DESCRIPTION_MAX_LENGTH - 1).trimEnd()}…`;
}

export function getFirstMarkdownImageUrl(markdown: string): string | null {
  const match = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/.exec(markdown);
  const url = match?.[1];

  if (!url || url.startsWith("data:")) {
    return null;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return new URL(url, getSiteUrl()).toString();
  }

  return null;
}
