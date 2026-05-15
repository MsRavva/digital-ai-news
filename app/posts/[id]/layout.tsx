import type { Metadata } from "next";
import {
  getFirstMarkdownImageUrl,
  getPostDescription,
  getPublicPostById,
  getSiteUrl,
} from "@/lib/post-metadata";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPostById(id);
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/posts/${id}`;

  if (!post) {
    return {
      title: "Публикация не найдена | Digital AI News",
      description: "Публикация не найдена или больше недоступна.",
      alternates: {
        canonical: postUrl,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = getPostDescription(post);
  const imageUrl = getFirstMarkdownImageUrl(post.content);

  return {
    title: `${post.title} | Digital AI News`,
    description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: "article",
      url: postUrl,
      siteName: "Digital AI News",
      title: post.title,
      description,
      publishedTime: post.created_at,
      authors: post.author?.username ? [post.author.username] : undefined,
      tags: post.tags,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default function PostLayout({ children }: Props) {
  return children;
}
