import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ThumbsUp, Eye, MoreHorizontal, Pencil } from "lucide-react"
import Link from "next/link"
import type { Post } from "@/types/database"
import { useAuth } from "@/context/auth-context"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { DeletePostButton } from "@/components/delete-post-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"


interface PostsListProps {
  posts: Post[]
}

export function PostsList({ posts: initialPosts }: PostsListProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  // Проверка, имеет ли пользователь права на удаление (учитель или админ)
  const canDelete = profile?.role === "teacher" || profile?.role === "admin";

  // Проверка, имеет ли пользователь права на редактирование (владелец, учитель или админ)
  const canEdit = (post: Post) => {
    if (!profile) return false;
    return profile.role === "teacher" || profile.role === "admin" || post.author?.username === profile.username;
  };

  // Обновляем список постов при изменении initialPosts
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Проверяем, что posts не undefined, не null и является массивом
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    console.log('Нет публикаций для отображения:', posts);
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Публикации не найдены</p>
      </div>
    )
  }



  return (
    <div className="card-grid">
      {posts.map((post) => (
          <div key={post.id} className="relative">
            <Link href={`/posts/${post.id}`}>
              <div className="post-card p-6 hover:border-primary/50 transition-all duration-200 rounded-lg w-full">
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 mr-1">
                          <SimpleAvatar username={post.author?.username} size="md" />
                        </div>
                        <span className="font-medium text-primary dark:text-primary whitespace-nowrap">
                          {post.author?.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-1">
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30"
                        >
                          {post.author?.role === "teacher" ? "Учитель" : "Ученик"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <button className="text-muted-foreground hover:text-primary transition-colors duration-200">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit(post) && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/edit/${post.id}`);
                            }}
                            className="text-primary hover:text-primary/80 focus:text-primary/80 cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Редактировать
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-red-500 hover:text-red-700 focus:text-red-700 cursor-pointer p-0"
                          >
                            <DeletePostButton
                              postId={post.id}
                              onSuccess={() => {
                                // Удаляем пост из локального состояния
                                setPosts(posts.filter(p => p.id !== post.id));
                              }}
                              variant="ghost"
                              showIcon={true}
                              showText={true}
                              className="w-full justify-start px-2 py-1.5 text-red-500 hover:text-red-700"
                            />
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="w-full">
                    <h3 className="text-xl font-semibold mt-3 group-hover:text-primary transition-colors duration-200 w-full">
                      {post.title}
                    </h3>
                    <div className="text-muted-foreground mt-2 line-clamp-2 w-full">
                      <div className="prose dark:prose-invert prose-sm max-w-none">
                        {post.content.length > 150
                          ? post.content.substring(0, 150) + '...'
                          : post.content
                        }
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 w-full">
                      {post.tags?.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground w-full">
                      <div className="flex items-center gap-1.5 hover:text-primary transition-colors duration-200">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.commentsCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-primary transition-colors duration-200">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likesCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-primary transition-colors duration-200">
                        <Eye className="h-4 w-4" />
                        <span>{post.viewsCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
    </div>
  )
}
