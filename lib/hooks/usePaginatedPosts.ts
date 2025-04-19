import { useState, useEffect, useCallback } from 'react';
import { getPaginatedPosts } from '@/lib/client-api';
import { Post } from '@/types/database';

export function usePaginatedPosts(options?: {
  initialLimit?: number;
  category?: string;
  authorId?: string;
  tag?: string;
}) {
  const limit = options?.initialLimit || 10;
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Функция для загрузки первой страницы
  const loadInitialPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPaginatedPosts({
        limit,
        category: options?.category,
        authorId: options?.authorId,
        tag: options?.tag
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
  }, [limit, options?.category, options?.authorId, options?.tag]);
  
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
        tag: options?.tag
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
  }, [lastVisible, loading, hasMore, limit, options?.category, options?.authorId, options?.tag]);
  
  // Загружаем первую страницу при монтировании компонента
  useEffect(() => {
    loadInitialPosts();
  }, [loadInitialPosts]);
  
  return {
    posts,
    loading,
    error,
    hasMore,
    loadMorePosts,
    refresh: loadInitialPosts,
  };
}
