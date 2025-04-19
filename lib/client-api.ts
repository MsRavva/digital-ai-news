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
  hasUserLikedComment as hasFirebaseUserLikedComment,
  likePost as likeFirebasePost,
  hasUserLikedPost as hasFirebaseUserLikedPost,
  deletePost as deleteFirebasePost,
  updatePost as updateFirebasePost,
  deleteComment as deleteFirebaseComment,
  toggleBookmark as toggleFirebaseBookmark,
  hasUserBookmarkedPost as hasFirebaseUserBookmarkedPost,
  getBookmarkedPosts as getFirebaseBookmarkedPosts,
  archivePost as archiveFirebasePost,
  unarchivePost as unarchiveFirebasePost,
  getArchivedPosts as getFirebaseArchivedPosts
} from './firebase-db';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
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
export async function getPosts(category?: string, includeArchived: boolean = false): Promise<Post[]> {
  // Если код выполняется на сервере, возвращаем моковые данные
  if (!isBrowser) {
    let filteredPosts = mockPosts;

    // Фильтруем по категории, если указана
    if (category) {
      filteredPosts = filteredPosts.filter(post => post.category === category);
    }

    // Исключаем архивированные посты, если не указано обратное
    if (!includeArchived) {
      filteredPosts = filteredPosts.filter(post => !post.archived);
    }

    return filteredPosts;
  }

  try {
    // Вызываем Firebase функцию
    const posts = await getFirebasePosts(category, includeArchived);

    // Дополнительная проверка для фильтрации архивированных постов
    if (!includeArchived) {
      return posts.filter(post => !post.archived);
    }

    return posts;
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
    // Вызываем Firebase функцию
    return await getFirebaseTags();
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
    // Вызываем Firebase функцию
    return await getFirebasePostById(id);
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
    // Вызываем Firebase функцию
    return await createFirebasePost(data);
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

// Лайк публикации
export async function likePost(postId: string, userId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await likeFirebasePost(postId, userId);
  } catch (error) {
    console.error('Ошибка при лайке/анлайке публикации:', error);
    return false;
  }
}

// Проверка, лайкнул ли пользователь публикацию
export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await hasFirebaseUserLikedPost(postId, userId);
  } catch (error) {
    console.error('Ошибка при проверке лайка публикации:', error);
    return false;
  }
}

// Добавление/удаление поста в избранное
export async function toggleBookmark(postId: string, userId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await toggleFirebaseBookmark(postId, userId);
  } catch (error) {
    console.error('Ошибка при добавлении/удалении избранного:', error);
    return false;
  }
}

// Проверка, добавил ли пользователь пост в избранное
export async function hasUserBookmarkedPost(postId: string, userId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await hasFirebaseUserBookmarkedPost(postId, userId);
  } catch (error) {
    console.error('Ошибка при проверке избранного:', error);
    return false;
  }
}

// Получение всех избранных постов пользователя
export async function getBookmarkedPosts(userId: string): Promise<Post[]> {
  // Если код выполняется на сервере, возвращаем пустой массив
  if (!isBrowser) {
    return [];
  }

  try {
    // Вызываем Firebase функцию
    return await getFirebaseBookmarkedPosts(userId);
  } catch (error) {
    console.error('Ошибка при получении избранных постов:', error);
    return [];
  }
}

// Архивирование поста
export async function archivePost(postId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await archiveFirebasePost(postId);
  } catch (error) {
    console.error('Ошибка при архивировании поста:', error);
    return false;
  }
}

// Восстановление поста из архива
export async function unarchivePost(postId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await unarchiveFirebasePost(postId);
  } catch (error) {
    console.error('Ошибка при восстановлении поста из архива:', error);
    return false;
  }
}

// Получение архивированных постов
export async function getArchivedPosts(): Promise<Post[]> {
  // Если код выполняется на сервере, возвращаем пустой массив
  if (!isBrowser) {
    return [];
  }

  try {
    // Вызываем Firebase функцию
    return await getFirebaseArchivedPosts();
  } catch (error) {
    console.error('Ошибка при получении архивированных постов:', error);
    return [];
  }
}

// Обновление поста
export async function updatePost(data: {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await updateFirebasePost(data);
  } catch (error) {
    console.error('Ошибка при обновлении поста:', error);
    return false;
  }
}

// Удаление комментария
export async function deleteComment(commentId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Вызываем Firebase функцию
    return await deleteFirebaseComment(commentId);
  } catch (error) {
    console.error('Ошибка при удалении комментария:', error);
    return false;
  }
}

// Удаление поста
export async function deletePost(postId: string): Promise<boolean> {
  // Если код выполняется на сервере, возвращаем false
  if (!isBrowser) {
    return false;
  }

  try {
    // Проверяем, что пост существует
    const post = await getFirebasePostById(postId);
    if (!post) {
      console.error('Пост не найден:', postId);
      return false;
    }

    // Получаем текущего пользователя
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('Пользователь не авторизован');
      return false;
    }

    // Вызываем Firebase функцию для удаления
    try {
      // Получаем профиль пользователя для проверки роли
      const userProfileRef = doc(getFirestore(), "profiles", currentUser.uid);
      const userProfileDoc = await getDoc(userProfileRef);

      if (!userProfileDoc.exists()) {
        console.error("User profile not found");
        return false;
      }

      const userProfile = userProfileDoc.data();
      const postData = post;

      // Проверяем права доступа
      const isAuthor = postData.author_id === currentUser.uid;
      const isTeacherOrAdmin = userProfile.role === "teacher" || userProfile.role === "admin";

      if (!isAuthor && !isTeacherOrAdmin) {
        console.error("User does not have permission to delete this post");
        return false;
      }

      return await deleteFirebasePost(postId);
    } catch (innerError) {
      console.error('Ошибка при проверке прав доступа:', innerError);
      return false;
    }
  } catch (error) {
    console.error('Ошибка при удалении поста:', error);
    // Выводим более подробную информацию об ошибке
    if (error instanceof Error) {
      console.error('Сообщение об ошибке:', error.message);
      if ('code' in error) {
        console.error('Код ошибки:', (error as any).code);
      }
    }
    return false;
  }
}
