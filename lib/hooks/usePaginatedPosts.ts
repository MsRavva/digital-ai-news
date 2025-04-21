import { useState, useEffect, useCallback, useRef } from 'react';
import { getPaginatedPosts } from '@/lib/client-api';
import { Post } from '@/types/database';

export function usePaginatedPosts(options?: {
  initialLimit?: number;
  category?: string;
  authorId?: string;
  tag?: string;
  includeArchived?: boolean;
}) {
  const limit = options?.initialLimit || 10;

  const [posts, setPosts] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Используем useRef для отслеживания изменений параметров фильтрации
  const prevOptionsRef = useRef({
    category: options?.category,
    authorId: options?.authorId,
    tag: options?.tag
  });

  // Функция для загрузки первой страницы
  const loadInitialPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Загрузка постов с категорией:', options?.category);
      const result = await getPaginatedPosts({
        limit,
        category: options?.category,
        authorId: options?.authorId,
        tag: options?.tag,
        includeArchived: options?.includeArchived
      });

      setPosts(result.posts);
      setLastVisible(result.lastVisible);
      setHasMore(!!result.lastVisible && result.posts.length === limit);
    } catch (err) {
      console.error('Failed to load posts:', err);
      setError(err instanceof Error ? err : new Error('Failed to load posts'));
    } finally {
      setLoading(false);
    }
  }, [limit, options?.category, options?.authorId, options?.tag, options?.includeArchived]);

  // Функция для загрузки следующей страницы
  const loadMorePosts = useCallback(async () => {
    if (!lastVisible || loading || !hasMore) return;

    setLoading(true);

    try {
      const result = await getPaginatedPosts({
        limit,
        startAfter: lastVisible,
        category: options?.category,
        authorId: options?.authorId,
        tag: options?.tag,
        includeArchived: options?.includeArchived
      });

      setPosts(prev => [...prev, ...result.posts]);
      setLastVisible(result.lastVisible);
      setHasMore(!!result.lastVisible && result.posts.length === limit);
    } catch (err) {
      console.error('Failed to load more posts:', err);
      setError(err instanceof Error ? err : new Error('Failed to load more posts'));
    } finally {
      setLoading(false);
    }
  }, [lastVisible, loading, hasMore, limit, options?.category, options?.authorId, options?.tag, options?.includeArchived]);

  // Функция для полного сброса состояния и загрузки данных заново
  const resetAndRefresh = useCallback(() => {
    setPosts([]);
    setLastVisible(null);
    setHasMore(true);
    loadInitialPosts();
  }, [loadInitialPosts]);

  // Загружаем первую страницу при монтировании компонента
  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);

  // Отслеживаем изменения параметров фильтрации и сбрасываем состояние при необходимости
  useEffect(() => {
    const prevOptions = prevOptionsRef.current;

    // Проверяем, изменились ли параметры фильтрации
    if (prevOptions.category !== options?.category ||
        prevOptions.authorId !== options?.authorId ||
        prevOptions.tag !== options?.tag) {

      console.log('Параметры фильтрации изменились:', {
        prevCategory: prevOptions.category,
        newCategory: options?.category,
        prevAuthorId: prevOptions.authorId,
        newAuthorId: options?.authorId,
        prevTag: prevOptions.tag,
        newTag: options?.tag
      });

      // Обновляем ref с текущими значениями
      prevOptionsRef.current = {
        category: options?.category,
        authorId: options?.authorId,
        tag: options?.tag
      };

      // Сбрасываем состояние и загружаем данные заново
      resetAndRefresh();
    }
  }, [options?.category, options?.authorId, options?.tag, resetAndRefresh]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMorePosts,
    refresh: loadInitialPosts,
    resetAndRefresh
  };
}
