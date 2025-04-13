import { SimpleAvatar } from "@/components/ui/simple-avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, ThumbsUp, Eye, MoreHorizontal, Trash2, Pencil } from "lucide-react"
import Link from "next/link"
import type { Post } from "@/types/database"
import { useAuth } from "@/context/auth-context"
import { deletePost } from "@/lib/client-api"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PostsListProps {
  posts: Post[]
}

export function PostsList({ posts: initialPosts }: PostsListProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  if (!posts || posts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Публикации не найдены</p>
      </div>
    )
  }

  const handleDeleteClick = (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPostToDelete(postId);
  }

  const confirmDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const success = await deletePost(postToDelete);

      if (success) {
        // Удаляем пост из локального состояния
        setPosts(posts.filter(post => post.id !== postToDelete));

        toast({
          title: "Успешно",
          description: "Публикация была удалена",
          variant: "default"
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить публикацию",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Ошибка при удалении публикации:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении публикации",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  }

  return (
    <>
      <AlertDialog open={postToDelete !== null} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление публикации</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить эту публикацию? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="card-grid">
        {posts.map((post) => (
          <div key={post.id} className="relative">
            <Link href={`/posts/${post.id}`}>
              <div className="post-card p-6 hover:border-[hsl(var(--saas-purple)/0.5)] transition-all duration-200 rounded-lg w-full">
                <div className="w-full">
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 mr-1">
                          <SimpleAvatar username={post.author?.username} size="md" />
                        </div>
                        <span className="font-medium text-[hsl(var(--saas-purple-dark))] dark:text-[hsl(var(--saas-purple-light))] whitespace-nowrap">
                          {post.author?.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-1">
                        <Badge
                          variant="outline"
                          className="bg-[hsl(var(--saas-purple)/0.1)] text-[hsl(var(--saas-purple))] border-[hsl(var(--saas-purple)/0.2)] dark:bg-[hsl(var(--saas-purple)/0.2)] dark:text-[hsl(var(--saas-purple-light))] dark:border-[hsl(var(--saas-purple)/0.3)]"
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
                        <button className="text-muted-foreground hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
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
                            className="text-[hsl(var(--saas-purple))] hover:text-[hsl(var(--saas-purple-dark))] focus:text-[hsl(var(--saas-purple-dark))] cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Редактировать
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(e, post.id)}
                            className="text-red-500 hover:text-red-700 focus:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="w-full">
                    <h3 className="text-xl font-semibold mt-3 group-hover:text-[hsl(var(--saas-purple))] transition-colors duration-200 w-full">
                      {post.title}
                    </h3>
                    <div className="text-muted-foreground mt-2 line-clamp-2 w-full prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        // Отключаем заголовки и другие блочные элементы в превью
                        h1: 'span',
                        h2: 'span',
                        h3: 'span',
                        h4: 'span',
                        h5: 'span',
                        h6: 'span',
                        // Ограничиваем длину текста
                        p: ({node, ...props}) => {
                          const content = props.children?.toString() || '';
                          const truncated = content.length > 150 ? content.substring(0, 150) + '...' : content;
                          return <span {...props}>{truncated}</span>;
                        }
                      }}>
                        {post.content}
                      </ReactMarkdown>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 w-full">
                      {post.tags?.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground w-full">
                      <div className="flex items-center gap-1.5 hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.commentsCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likesCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 hover:text-[hsl(var(--saas-purple))] transition-colors duration-200">
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
    </>
  )
}
