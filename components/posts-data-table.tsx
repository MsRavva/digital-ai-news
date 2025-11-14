"use client"

import { useId, useState, useEffect, useCallback } from "react"
import { SearchIcon, MessageSquare, ThumbsUp, Eye, Pencil, Paperclip, Archive, ArchiveRestore, Trash2 } from "lucide-react"
import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SimpleAvatar } from "@/components/simple-avatar"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { Post } from "@/types/database"
import { getPosts } from "@/lib/supabase-posts"
import { togglePinPost, archivePost, unarchivePost, deletePost } from "@/lib/supabase-post-actions"
import { useAuth } from "@/context/auth-context-supabase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import {
  saveCategoryToCookie,
  getCategoryFromCookie,
  saveCategoryToProfile,
  getCategoryFromProfile,
} from "@/lib/category-storage"
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

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text"
  }
}

const createColumns = (
  canEdit: (post: Post) => boolean,
  isTeacherOrAdmin: boolean,
  canDelete: (post: Post) => boolean,
  handleEdit: (postId: string) => void,
  handleTogglePin: (postId: string) => void,
  handleToggleArchive: (postId: string, archived: boolean) => void,
  handleDelete: (postId: string) => void,
  onTagClick?: (tag: string) => void,
): ColumnDef<Post>[] => [
  {
    header: "Автор",
    accessorKey: "author",
    cell: ({ row }) => (
      <div className="flex items-center gap-3 min-w-[180px]">
        <SimpleAvatar username={row.original.author?.username} size="sm" />
        <div className="flex flex-col">
          <div className="font-medium">{row.original.author?.username}</div>
          <Badge variant="outline" className="w-fit text-xs">
            {row.original.author?.role === "teacher"
              ? "Учитель"
              : row.original.author?.role === "admin"
                ? "Администратор"
                : "Ученик"}
          </Badge>
        </div>
      </div>
    ),
    enableSorting: false,
  },
  {
    header: "Заголовок",
    accessorKey: "title",
    cell: ({ row }) => (
      <Link
        href={`/posts/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.getValue("title")}
      </Link>
    ),
    meta: {
      filterVariant: "text",
    },
  },
  {
    header: "Дата",
    accessorKey: "created_at",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      const day = String(date.getDate()).padStart(2, "0")
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const year = String(date.getFullYear()).slice(-2)
      return (
        <div className="text-sm text-muted-foreground">
          {`${day}.${month}.${year}`}
        </div>
      )
    },
  },
  {
    header: "Теги",
    accessorKey: "tags",
    cell: ({ row }) => {
      const tags = row.original.tags || []
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onTagClick?.(tag)
              }}
            >
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    header: "Статистика",
    accessorKey: "stats",
    cell: ({ row }) => {
      const likesCount = row.original.likesCount || 0
      const commentsCount = row.original.commentsCount || 0
      const viewsCount = row.original.viewsCount || 0

      return (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            {likesCount}
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {commentsCount}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {viewsCount}
          </div>
        </div>
      )
    },
    enableSorting: false,
  },
  {
    header: "Действия",
    id: "actions",
    cell: ({ row }) => {
      const post = row.original
      return (
        <div className="flex items-center gap-1">
          {canEdit(post) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary hover:text-primary/80"
              onClick={(e) => {
                e.stopPropagation()
                handleEdit(post.id)
              }}
              title="Редактировать"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {isTeacherOrAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${post.pinned ? "text-primary" : "text-muted-foreground"}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleTogglePin(post.id)
                }}
                title={post.pinned ? "Открепить" : "Закрепить"}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${post.archived ? "text-[var(--chart-3)]" : "text-[var(--chart-4)]"}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleArchive(post.id, !!post.archived)
                }}
                title={post.archived ? "Восстановить из архива" : "Архивировать"}
              >
                {post.archived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
          {canDelete(post) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(post.id)
              }}
              title="Удалить"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
]

function SearchFilter({ column, onTagClick }: { column: Column<any, unknown>, onTagClick?: (tag: string) => void }) {
  const id = useId()
  const columnFilterValue = column.getFilterValue()

  return (
    <div className="relative">
      <Input
        id={`${id}-input`}
        className="peer pl-9"
        value={(columnFilterValue ?? "") as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder=""
        type="text"
      />
      <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 left-0 flex items-center gap-2 pl-3 peer-disabled:opacity-50">
        <SearchIcon size={16} />
        <span className="text-sm">Поиск</span>
      </div>
    </div>
  )
}

interface PostsDataTableProps {
  archivedOnly?: boolean
  category?: string
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function PostsDataTable({ archivedOnly = false, category, searchQuery = "", onSearchChange }: PostsDataTableProps) {
  const { profile, user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [postIdToDelete, setPostIdToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  // Используем проп category как основной источник, с fallback на внутреннее состояние
  const [internalCategory, setInternalCategory] = useState<string>(() => {
    // Пытаемся получить из cookie только если проп не передан
    if (!category) {
      const cookieCategory = getCategoryFromCookie()
      if (cookieCategory) {
        return cookieCategory
      }
    }
    return category || "all"
  })
  
  // Используем проп category, если он передан, иначе используем внутреннее состояние
  const selectedCategory = category || internalCategory
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Синхронизация searchQuery с фильтрами
  useEffect(() => {
    if (searchQuery !== undefined) {
      setColumnFilters(prev => {
        const filtered = prev.filter(f => f.id !== "title")
        return searchQuery ? [...filtered, { id: "title", value: searchQuery }] : filtered
      })
    }
  }, [searchQuery])

  // Проверка прав доступа
  const isTeacherOrAdmin = !authLoading && (profile?.role === "teacher" || profile?.role === "admin")

  const canEdit = (post: Post) => {
    if (authLoading || !profile) return false
    return (
      profile.role === "teacher" ||
      profile.role === "admin" ||
      post.author?.username === profile.username
    )
  }

  const canDelete = (post: Post) => {
    if (authLoading || !profile) {
      return false
    }
    return profile.role === "admin" || profile.role === "teacher"
  }

  // Обработчики действий
  const handleEdit = (postId: string) => {
    router.push(`/edit/${postId}`)
  }

  const handleTogglePin = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const success = await togglePinPost(postId)
      if (success) {
        const newPinned = !post.pinned
        setPosts(
          posts.map((p) => (p.id === postId ? { ...p, pinned: newPinned } : p)),
        )
        toast.success(
          newPinned ? "Публикация закреплена" : "Публикация откреплена",
        )
      } else {
        toast.error("Не удалось изменить статус закрепления")
      }
    } catch (error) {
      console.error("Error toggling pin:", error)
      toast.error("Произошла ошибка")
    }
  }

  const handleToggleArchive = async (postId: string, archived: boolean) => {
    try {
      const success = archived
        ? await unarchivePost(postId)
        : await archivePost(postId)
      if (success) {
        toast.success(
          archived
            ? "Публикация восстановлена из архива"
            : "Публикация архивирована",
        )
        // Перезагружаем посты после успешного архивирования
        await loadPosts()
      } else {
        toast.error("Не удалось изменить статус архивации")
      }
    } catch (error) {
      console.error("Error toggling archive:", error)
      toast.error("Произошла ошибка")
    }
  }

  const handleDelete = (postId: string) => {
    setPostIdToDelete(postId)
  }

  const confirmDelete = async () => {
    if (!postIdToDelete) return

    setIsDeleting(true)

    try {
      const success = await deletePost(postIdToDelete)
      if (success) {
        setPosts(posts.filter((post) => post.id !== postIdToDelete))
        toast.success("Публикация удалена")
      } else {
        toast.error("Не удалось удалить публикацию")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("Произошла ошибка")
    } finally {
      setIsDeleting(false)
      setPostIdToDelete(null)
    }
  }

  // Синхронизация внутреннего состояния с пропом category
  useEffect(() => {
    if (category && category !== internalCategory) {
      setInternalCategory(category)
    }
  }, [category, internalCategory])

  // Функция загрузки публикаций
  const loadPosts = useCallback(async () => {
    // Не загружаем посты, если пользователь не авторизован
    if (!user || authLoading) {
      return
    }

    setLoading(true)
    try {
      // Используем category из пропа напрямую, если он передан, иначе internalCategory
      const categoryToUse = (category || internalCategory) === "all" ? undefined : (category || internalCategory)
      const fetchedPosts = await getPosts(categoryToUse, archivedOnly, archivedOnly)
      // Посты уже отсортированы из Firestore (pinned desc, created_at desc)
      setPosts(fetchedPosts)
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }, [category, internalCategory, archivedOnly, user?.id, authLoading])

  // Загрузка публикаций (только для авторизованных пользователей)
  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const handleTagClick = (tag: string) => {
    onSearchChange?.(tag)
  }

  const columns = createColumns(
    canEdit,
    isTeacherOrAdmin,
    canDelete,
    handleEdit,
    handleTogglePin,
    handleToggleArchive,
    handleDelete,
    handleTagClick,
  )

  const table = useReactTable({
    data: posts,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Не используем getSortedRowModel, чтобы сохранить порядок из Firestore (pinned сверху)
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
  })


  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Spinner className="h-5 w-5" />
          <p className="text-muted-foreground">Загрузка публикаций...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AlertDialog open={postIdToDelete !== null} onOpenChange={(open) => !open && setPostIdToDelete(null)}>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full">
        {!category && (
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={selectedCategory}
            onValueChange={(newCategory) => {
              setInternalCategory(newCategory)
              // Если проп category не передан, сохраняем в куки
              if (!category) {
                saveCategoryToCookie(newCategory)
                if (user) {
                  saveCategoryToProfile(user.id, newCategory).catch(console.error)
                }
              }
            }}
            className="w-auto"
          >
            <TabsList className="bg-muted dark:bg-muted rounded-lg p-1 h-10 flex items-center w-auto shadow-sm">
              <TabsTrigger
                value="all"
                className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200"
              >
                Все категории
              </TabsTrigger>
              <TabsTrigger
                value="news"
                className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200"
              >
                Новости
              </TabsTrigger>
              <TabsTrigger
                value="materials"
                className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200"
              >
                Учебные материалы
              </TabsTrigger>
              <TabsTrigger
                value="project-ideas"
                className="px-4 py-1.5 text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-background rounded-sm transition-all duration-200"
              >
                Идеи проектов
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-full sm:w-64">
            <SearchFilter column={table.getColumn("title")!} />
          </div>
        </div>
      )}

      <div className={cn(
        "rounded-3xl border border-border/50 dark:border-white/[0.1] transition-all duration-300 overflow-hidden",
        "shadow-[0_2px_15px_rgba(0,0,0,0.08),0_8px_25px_rgba(0,0,0,0.05)]",
        "dark:shadow-[0_2px_20px_rgba(98,51,255,0.12),0_8px_35px_rgba(98,51,255,0.08),0_0_0_1px_rgba(255,255,255,0.03)]",
        "hover:shadow-[0_4px_25px_rgba(0,0,0,0.12),0_12px_40px_rgba(0,0,0,0.08)]",
        "dark:hover:shadow-[0_4px_30px_rgba(98,51,255,0.18),0_12px_50px_rgba(98,51,255,0.12),0_0_0_1px_rgba(255,255,255,0.05)]"
      )}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup, groupIndex) => (
              <TableRow key={headerGroup.id} className={cn(
                "bg-muted/50",
                groupIndex === 0 && "[&>th:first-child]:rounded-tl-3xl [&>th:last-child]:rounded-tr-3xl"
              )}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="relative h-10 border-t select-none px-6 py-3"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center px-6 py-3">
                  Публикации не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    </>
  )
}

