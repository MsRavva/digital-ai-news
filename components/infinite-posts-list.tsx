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
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Индикатор загрузки или конца списка */}
      {loading ? (
        <div className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      ) : hasMore ? (
        // Элемент, который будет отслеживаться для загрузки следующей страницы
        <div ref={ref} className="h-10" />
      ) : posts.length > 0 ? (
        <div className="text-center text-muted-foreground p-4">
          Больше публикаций нет
        </div>
      ) : (
        <div className="text-center text-muted-foreground p-4">
          Публикации не найдены
        </div>
      )}
    </div>
  )
}

// Скелетон для карточки публикации
function PostCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-20 w-full" />
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}
