'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePaginatedPosts } from '@/lib/hooks/usePaginatedPosts'
import { PostCard } from './post-card'
import { Skeleton } from './ui/skeleton'
import { useInView } from 'react-intersection-observer'

interface InfinitePostsListProps {
  category?: string
  authorId?: string
  tag?: string
  initialLimit?: number
  includeArchived?: boolean
}

export function InfinitePostsList({
  category,
  authorId,
  tag,
  initialLimit = 10,
  includeArchived = false
}: InfinitePostsListProps) {
  const { posts, loading, error, hasMore, loadMorePosts } = usePaginatedPosts({
    initialLimit,
    category,
    authorId,
    tag,
    includeArchived
  })

  // Используем react-intersection-observer для определения, когда пользователь прокрутил до конца списка
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // Загружаем больше постов, когда пользователь прокрутил до конца списка
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMorePosts()
    }
  }, [inView, hasMore, loading, loadMorePosts])

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Ошибка при загрузке публикаций: {error.message}
      </div>
    )
  }

  return (
    <div className="card-grid">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Индикатор загрузки или конца списка */}
      {loading ? (
        <div className="col-span-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        </div>
      ) : hasMore ? (
        // Элемент, который будет отслеживаться для загрузки следующей страницы
        <div ref={ref} className="h-10 col-span-full" />
      ) : posts.length > 0 ? (
        <div className="text-center text-muted-foreground p-4 col-span-full">
          Больше публикаций нет
        </div>
      ) : (
        <div className="text-center text-muted-foreground p-4 col-span-full">
          Публикации не найдены
        </div>
      )}
    </div>
  )
}

// Скелетон для карточки публикации
function PostCardSkeleton() {
  return (
    <div className="post-card p-6 rounded-lg w-full">
      <div className="w-full">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2 ml-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <div className="w-full">
          <Skeleton className="h-6 w-3/4 mt-3" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-full mt-1" />
          <div className="flex flex-wrap gap-2 mt-4 w-full">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="flex items-center gap-6 mt-4 w-full">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}
