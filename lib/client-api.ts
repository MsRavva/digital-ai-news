import {
  getPosts as getFirebasePosts,
  getAllTags as getFirebaseTags,
  getPostById as getFirebasePostById,
  getCommentsByPostId as getFirebaseCommentsByPostId,
  addComment as addFirebaseComment,
  createPost as createFirebasePost,
  recordView as recordFirebaseView,
  likeComment as likeFirebaseComment,
  unlikeComment as unlikeFirebaseComment,
  hasUserLikedComment as hasFirebaseUserLikedComment
} from './firebase-db';
import { Post, Tag } from '@/types/database';

// Проверка, что код выполняется в браузере
const isBrowser = typeof window !== 'undefined';

// Моковые данные для тестирования
const mockPosts: Post[] = [
  {
    id: '1',
    title: 'В ИИ-сервисе вместо искусственного интеллекта работали сотни операторов',
    content: 'Основанный в 2018 году и позиционировавшийся как разработчик универсального решения для онлайн-шопинга «в один клик» стартап Nate вместо заявленного искусственного интеллекта на самом деле использовал труд сотен филиппинцев.',
    author: {
      username: 'Стенин Алексей',
      role: 'teacher'
    },
    created_at: '2025-04-12T20:23:18.000Z',
    category: 'news',
    tags: ['ИИ', 'Технологии', 'Стартапы'],
    likesCount: 45,
    commentsCount: 12,
    viewsCount: 230
  },
  {
    id: '2',
    title: 'Новые возможности GPT-4 для веб-разработки',
    content: 'Недавно OpenAI представила обновление для GPT-4, которое значительно расширяет возможности этой модели в контексте веб-разработки. В этой статье мы рассмотрим ключевые улучшения и как они могут быть использованы для оптимизации рабочего процесса.',
    author: {
      username: 'Анна Смирнова',
      role: 'teacher'
    },
    created_at: '2025-04-11T15:30:00.000Z',
    category: 'news',
    tags: ['GPT-4', 'OpenAI', 'Веб-разработка'],
    likesCount: 32,
    commentsCount: 8,
    viewsCount: 175
  }
];

const mockTags: Tag[] = [
  { id: '1', name: 'ИИ' },
  { id: '2', name: 'Технологии' },
  { id: '3', name: 'Стартапы' },
  { id: '4', name: 'GPT-4' },
  { id: '5', name: 'OpenAI' },
  { id: '6', name: 'Веб-разработка' }
];

// Клиентские версии API функций
export async function getPosts(category?: string): Promise<Post[]> {
  // Если код выполняется на сервере, возвращаем моковые данные
  if (!isBrowser) {
    if (category) {
      return mockPosts.filter(post => post.category === category);
    }
    return mockPosts;
  }

  try {
    // Для тестирования используем моковые данные
    if (category) {
      return mockPosts.filter(post => post.category === category);
    }
    return mockPosts;
  } catch (error) {
    console.error('Ошибка при получении постов:', error);
    return [];
  }
}

export async function getAllTags(): Promise<Tag[]> {
  // Если код выполняется на сервере, возвращаем моковые данные
  if (!isBrowser) {
    return mockTags;
  }

  try {
    // Для тестирования используем моковые данные
    return mockTags;
  } catch (error) {
    console.error('Ошибка при получении тегов:', error);
    return [];
  }
}

export async function getPostById(id: string) {
  // Если код выполняется на сервере, возвращаем моковые данные
  if (!isBrowser) {
    const post = mockPosts.find(p => p.id === id);
    return post || null;
  }

  try {
    // Для тестирования используем моковые данные
    const post = mockPosts.find(p => p.id === id);
    return post || null;
  } catch (error) {
    console.error('Ошибка при получении поста:', error);
    return null;
  }
}

export async function getCommentsByPostId(postId: string) {
  // Если код выполняется на сервере, возвращаем пустой массив
  if (!isBrowser) {
    return [];
  }

  try {
    // Вызываем Firebase функцию
    return await getFirebaseCommentsByPostId(postId);
  } catch (error) {
    console.error('Ошибка при получении комментариев:', error);
    return [];
  }
}

export async function addComment(data: {
  content: string;
  post_id: string;
  author_id: string;
  parent_id?: string;
}) {
  // Если код выполняется на сервере, возвращаем фиктивный ID
  if (!isBrowser) {
    return 'comment-' + Date.now();
  }

  try {
    // Вызываем Firebase функцию
    return await addFirebaseComment(data);
  } catch (error) {
    console.error('Ошибка при добавлении комментария:', error);
    return null;
  }
}

export async function createPost(data: {
  title: string;
  content: string;
  category: string;
  author_id: string;
  tags: string[];
}) {
  // Если код выполняется на сервере, возвращаем фиктивный ID
  if (!isBrowser) {
    return 'post-' + Date.now();
  }

  try {
    // Для тестирования возвращаем фиктивный ID
    return 'post-' + Date.now();
  } catch (error) {
    console.error('Ошибка при создании поста:', error);
    return null;
  }
}

export async function recordView(postId: string, userId: string) {
  // Если код выполняется на сервере, ничего не делаем
  if (!isBrowser) {
    return;
  }

  try {
    // Вызываем Firebase функцию
    return await recordFirebaseView(postId, userId);
  } catch (error) {
    console.error('Ошибка при записи просмотра:', error);
  }
}

// Лайк комментария
export async function likeComment(commentId: string, userId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await likeFirebaseComment(commentId, userId);
  } catch (error) {
    console.error('Ошибка при лайке комментария:', error);
    return false;
  }
}

// Удаление лайка комментария
export async function unlikeComment(commentId: string, userId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await unlikeFirebaseComment(commentId, userId);
  } catch (error) {
    console.error('Ошибка при удалении лайка комментария:', error);
    return false;
  }
}

// Проверка, лайкнул ли пользователь комментарий
export async function hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await hasFirebaseUserLikedComment(commentId, userId);
  } catch (error) {
    console.error('Ошибка при проверке лайка комментария:', error);
    return false;
  }
}
