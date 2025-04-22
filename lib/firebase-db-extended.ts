import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction,
  writeBatch
} from "firebase/firestore";
import { Post, Comment, Tag, PostStats } from "@/types/database";
import { db, convertTimestampToISO } from "./firebase-db-core";

// Получение публикаций с пагинацией
export async function getPaginatedPosts(options: {
  limit?: number;
  startAfter?: string;
  category?: string;
  authorId?: string;
  tag?: string;
  includeArchived?: boolean;
}): Promise<{ posts: Post[]; lastVisible: string | null }> {
  try {
    const {
      limit: limitCount = 10,
      startAfter: startAfterId,
      category,
      authorId,
      tag,
      includeArchived = false
    } = options;

    // Шаг 1: Создаем базовый запрос
    let postsQuery = collection(db, "posts");
    let queryConditions = [];

    // Добавляем фильтр по категории, если указана
    if (category && category !== 'all') {
      queryConditions.push(where("category", "==", category));
    }

    // Добавляем фильтр по автору, если указан
    if (authorId) {
      queryConditions.push(where("author_id", "==", authorId));
    }

    // Добавляем фильтр по архивации
    if (!includeArchived) {
      queryConditions.push(where("archived", "in", [false, null]));
    }

    // Добавляем сортировку по закреплению и дате создания
    queryConditions.push(orderBy("pinned", "desc")); // Сначала закрепленные
    queryConditions.push(orderBy("created_at", "desc")); // Затем по дате (от новых к старым)

    // Применяем фильтры
    postsQuery = query(postsQuery, ...queryConditions);

    // Если указан startAfter, добавляем курсор для пагинации
    if (startAfterId) {
      const startAfterDoc = await getDoc(doc(db, "posts", startAfterId));
      if (startAfterDoc.exists()) {
        postsQuery = query(postsQuery, startAfter(startAfterDoc));
      }
    }

    // Добавляем ограничение по количеству результатов
    postsQuery = query(postsQuery, limit(limitCount));

    // Шаг 2: Получаем посты
    const postsSnapshot = await getDocs(postsQuery);

    if (postsSnapshot.empty) {
      return { posts: [], lastVisible: null };
    }

    // Фильтрация по тегу будет производиться после получения данных
    const postIds = postsSnapshot.docs.map(doc => doc.id);
    const authorIds = [...new Set(postsSnapshot.docs.map(doc => doc.data().author_id).filter(id => id !== undefined && id !== null))];

    // Шаг 3: Получаем всех авторов одним запросом
    const authorsMap = new Map();
    for (const authorId of authorIds) {
      if (authorId) { // Проверяем, что authorId не undefined и не null
        try {
          const authorDoc = await getDoc(doc(db, "profiles", authorId));
          if (authorDoc.exists()) {
            authorsMap.set(authorId, authorDoc.data());
          }
        } catch (error) {
          console.error(`Ошибка при получении профиля автора ${authorId}:`, error);
        }
      }
    }

    // Шаг 4: Получаем все связи постов с тегами по частям (максимум 30 значений в IN)
    let allPostTagsDocs = [];

    // Разбиваем массив postIds на части по 30 элементов
    for (let i = 0; i < postIds.length; i += 30) {
      const postIdsBatch = postIds.slice(i, i + 30);

      if (postIdsBatch.length > 0) {
        const postTagsQuery = query(
          collection(db, "post_tags"),
          where("post_id", "in", postIdsBatch)
        );
        const batchSnapshot = await getDocs(postTagsQuery);
        allPostTagsDocs = [...allPostTagsDocs, ...batchSnapshot.docs];
      }
    }

    // Создаем объект с нужной структурой
    const postTagsSnapshot = { docs: allPostTagsDocs };

    // Группируем связи по ID поста
    const postTagsMap = new Map();
    postTagsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!postTagsMap.has(data.post_id)) {
        postTagsMap.set(data.post_id, []);
      }
      postTagsMap.get(data.post_id).push(data.tag_id);
    });

    // Шаг 5: Получаем все теги одним запросом
    const allTagIds = [...new Set(postTagsSnapshot.docs.map(doc => doc.data().tag_id))];
    const tagsMap = new Map();

    if (allTagIds.length > 0) {
      for (const tagId of allTagIds) {
        const tagDoc = await getDoc(doc(db, "tags", tagId));
        if (tagDoc.exists()) {
          tagsMap.set(tagId, tagDoc.data().name);
        }
      }
    }

    // Фильтрация по тегу, если указан
    let filteredPostIds = postIds;
    if (tag) {
      // Находим ID тега по имени
      const tagQuery = query(
        collection(db, "tags"),
        where("name", "==", tag)
      );
      const tagSnapshot = await getDocs(tagQuery);

      if (!tagSnapshot.empty) {
        const tagId = tagSnapshot.docs[0].id;

        // Фильтруем посты по тегу
        filteredPostIds = postIds.filter(postId => {
          const postTagIds = postTagsMap.get(postId) || [];
          return postTagIds.includes(tagId);
        });
      } else {
        // Если тег не найден, возвращаем пустой результат
        return { posts: [], lastVisible: null };
      }
    }

    // Шаг 6: Получаем статистику для всех постов по частям
    // Лайки
    const likesCountMap = new Map();
    for (let i = 0; i < filteredPostIds.length; i += 30) {
      const postIdsBatch = filteredPostIds.slice(i, i + 30);

      if (postIdsBatch.length > 0) {
        const likesQuery = query(
          collection(db, "likes"),
          where("post_id", "in", postIdsBatch)
        );
        const likesSnapshot = await getDocs(likesQuery);

        likesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          likesCountMap.set(data.post_id, (likesCountMap.get(data.post_id) || 0) + 1);
        });
      }
    }

    // Комментарии
    const commentsCountMap = new Map();
    for (let i = 0; i < filteredPostIds.length; i += 30) {
      const postIdsBatch = filteredPostIds.slice(i, i + 30);

      if (postIdsBatch.length > 0) {
        const commentsQuery = query(
          collection(db, "comments"),
          where("post_id", "in", postIdsBatch)
        );
        const commentsSnapshot = await getDocs(commentsQuery);

        commentsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          commentsCountMap.set(data.post_id, (commentsCountMap.get(data.post_id) || 0) + 1);
        });
      }
    }

    // Просмотры
    const viewsCountMap = new Map();
    for (let i = 0; i < filteredPostIds.length; i += 30) {
      const postIdsBatch = filteredPostIds.slice(i, i + 30);

      if (postIdsBatch.length > 0) {
        const viewsQuery = query(
          collection(db, "views"),
          where("post_id", "in", postIdsBatch)
        );
        const viewsSnapshot = await getDocs(viewsQuery);

        viewsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          viewsCountMap.set(data.post_id, (viewsCountMap.get(data.post_id) || 0) + 1);
        });
      }
    }

    // Шаг 7: Формируем итоговый массив постов
    const filteredDocs = postsSnapshot.docs.filter(doc => filteredPostIds.includes(doc.id));
    const posts: Post[] = filteredDocs.map(postDoc => {
      const postData = postDoc.data();
      const postId = postDoc.id;

      // Получаем автора
      const authorData = authorsMap.get(postData.author_id);

      // Получаем теги
      const tagIds = postTagsMap.get(postId) || [];
      const tags = tagIds.map(tagId => tagsMap.get(tagId)).filter(Boolean);

      // Получаем статистику
      const likesCount = likesCountMap.get(postId) || 0;
      const commentsCount = commentsCountMap.get(postId) || 0;
      const viewsCount = viewsCountMap.get(postId) || 0;

      return {
        id: postId,
        title: postData.title,
        content: postData.content,
        author: {
          username: authorData?.username || "Unknown",
          role: authorData?.role || "student"
        },
        created_at: convertTimestampToISO(postData.created_at),
        category: postData.category,
        tags,
        likesCount,
        commentsCount,
        viewsCount,
        archived: postData.archived || false,
        pinned: postData.pinned || false
      };
    });

    // Шаг 8: Возвращаем результат
    const lastVisible = filteredDocs.length > 0 ? filteredDocs[filteredDocs.length - 1].id : null;

    return { posts, lastVisible };
  } catch (error) {
    console.error("Error fetching paginated posts:", error);
    return { posts: [], lastVisible: null };
  }
}

// Получение архивированных постов
export async function getArchivedPosts(): Promise<Post[]> {
  try {
    // Шаг 1: Получаем все посты
    let postsQuery = collection(db, "posts");

    // Создаем запрос с условиями
    let queryConditions = [];

    // Добавляем фильтр по полю archived=true
    queryConditions.push(where("archived", "==", true));

    // Добавляем сортировку по закреплению и дате создания
    queryConditions.push(orderBy("pinned", "desc")); // Сначала закрепленные
    queryConditions.push(orderBy("created_at", "desc")); // Затем по дате (от новых к старым)

    // Создаем запрос с условиями
    postsQuery = query(postsQuery, ...queryConditions);

    // Получаем все архивированные посты
    const postsSnapshot = await getDocs(postsQuery);

    if (postsSnapshot.empty) {
      return [];
    }

    // Шаг 2: Собираем все ID авторов для пакетного запроса
    const authorIds = [...new Set(postsSnapshot.docs.map(doc => doc.data().author_id).filter(id => id !== undefined && id !== null))];
    const postIds = postsSnapshot.docs.map(doc => doc.id);

    // Шаг 3: Получаем всех авторов одним запросом
    const authorsMap = new Map();
    for (const authorId of authorIds) {
      if (authorId) { // Проверяем, что authorId не undefined и не null
        try {
          const authorDoc = await getDoc(doc(db, "profiles", authorId));
          if (authorDoc.exists()) {
            authorsMap.set(authorId, authorDoc.data());
          }
        } catch (error) {
          console.error(`Ошибка при получении профиля автора ${authorId}:`, error);
        }
      }
    }

    // Шаг 4: Получаем все связи постов с тегами по частям (максимум 30 значений в IN)
    // Создаем массив для хранения всех документов
    let allPostTagsDocs = [];

    // Разбиваем массив postIds на части по 30 элементов
    for (let i = 0; i < postIds.length; i += 30) {
      const postIdsBatch = postIds.slice(i, i + 30);

      if (postIdsBatch.length > 0) {
        const postTagsQuery = query(
          collection(db, "post_tags"),
          where("post_id", "in", postIdsBatch)
        );
        const batchSnapshot = await getDocs(postTagsQuery);
        allPostTagsDocs = [...allPostTagsDocs, ...batchSnapshot.docs];
      }
    }

    // Создаем объект с нужной структурой
    const postTagsSnapshot = { docs: allPostTagsDocs };

    // Группируем связи по ID поста
    const postTagsMap = new Map();
    postTagsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!postTagsMap.has(data.post_id)) {
        postTagsMap.set(data.post_id, []);
      }
      postTagsMap.get(data.post_id).push(data.tag_id);
    });

    // Шаг 5: Получаем все теги одним запросом
    const allTagIds = [...new Set(postTagsSnapshot.docs.map(doc => doc.data().tag_id))];
    const tagsMap = new Map();

    if (allTagIds.length > 0) {
      for (const tagId of allTagIds) {
        const tagDoc = await getDoc(doc(db, "tags", tagId));
        if (tagDoc.exists()) {
          tagsMap.set(tagId, tagDoc.data().name);
        }
      }
    }

    // Шаг 6: Получаем статистику для всех постов по частям
    // Лайки
    const likesCountMap = new Map();
    for (let i = 0; i < postIds.length; i += 30) {
      const postIdsBatch = postIds.slice(i, i + 30);

      if (postIdsBatch.length > 0) {
        const likesQuery = query(
          collection(db, "likes"),
          where("post_id", "in", postIdsBatch)
        );
        const likesSnapshot = await getDocs(likesQuery);

        likesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          likesCountMap.set(data.post_id, (likesCountMap.get(data.post_id) || 0) + 1);
        });
      }
    }

    // Комментарии
    const commentsCountMap = new Map();
    for (let i = 0; i < postIds.length; i += 30) {
      const postIdsBatch = postIds.slice(i, i + 30);

      if (postIdsBatch.length > 0) {
        const commentsQuery = query(
          collection(db, "comments"),
          where("post_id", "in", postIdsBatch)
        );
        const commentsSnapshot = await getDocs(commentsQuery);

        commentsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          commentsCountMap.set(data.post_id, (commentsCountMap.get(data.post_id) || 0) + 1);
        });
      }
    }

    // Просмотры
    const viewsCountMap = new Map();
    for (let i = 0; i < postIds.length; i += 30) {
      const postIdsBatch = postIds.slice(i, i + 30);

      if (postIdsBatch.length > 0) {
        const viewsQuery = query(
          collection(db, "views"),
          where("post_id", "in", postIdsBatch)
        );
        const viewsSnapshot = await getDocs(viewsQuery);

        viewsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          viewsCountMap.set(data.post_id, (viewsCountMap.get(data.post_id) || 0) + 1);
        });
      }
    }

    // Шаг 7: Формируем итоговый массив постов
    const posts: Post[] = postsSnapshot.docs.map(postDoc => {
      const postData = postDoc.data();
      const postId = postDoc.id;

      // Получаем автора
      const authorData = authorsMap.get(postData.author_id);

      // Получаем теги
      const tagIds = postTagsMap.get(postId) || [];
      const tags = tagIds.map(tagId => tagsMap.get(tagId)).filter(Boolean);

      // Получаем статистику
      const likesCount = likesCountMap.get(postId) || 0;
      const commentsCount = commentsCountMap.get(postId) || 0;
      const viewsCount = viewsCountMap.get(postId) || 0;

      return {
        id: postId,
        title: postData.title,
        content: postData.content,
        author: {
          username: authorData?.username || "Unknown",
          role: authorData?.role || "student"
        },
        created_at: convertTimestampToISO(postData.created_at),
        category: postData.category,
        tags,
        likesCount,
        commentsCount,
        viewsCount,
        archived: true, // Явно устанавливаем флаг archived
        pinned: postData.pinned || false
      };
    });

    return posts;
  } catch (error) {
    console.error("Error fetching archived posts:", error);
    return [];
  }
}

// Получение публикаций по категории
export async function getPostsByCategory(category: string): Promise<Post[]> {
  try {
    // Используем функцию getPaginatedPosts с параметром category
    const result = await getPaginatedPosts({
      category,
      limit: 100 // Большой лимит для получения большинства публикаций
    });

    return result.posts;
  } catch (error) {
    console.error(`Error fetching posts by category ${category}:`, error);
    return [];
  }
}

// Получение публикаций по автору
export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  try {
    // Используем функцию getPaginatedPosts с параметром authorId
    const result = await getPaginatedPosts({
      authorId,
      limit: 100 // Большой лимит для получения большинства публикаций
    });

    return result.posts;
  } catch (error) {
    console.error(`Error fetching posts by author ${authorId}:`, error);
    return [];
  }
}

// Получение публикаций по тегу
export async function getPostsByTag(tag: string): Promise<Post[]> {
  try {
    // Используем функцию getPaginatedPosts с параметром tag
    const result = await getPaginatedPosts({
      tag,
      limit: 100 // Большой лимит для получения большинства публикаций
    });

    return result.posts;
  } catch (error) {
    console.error(`Error fetching posts by tag ${tag}:`, error);
    return [];
  }
}

// Получение всех тегов
export async function getAllTags(): Promise<Tag[]> {
  try {
    const tagsSnapshot = await getDocs(collection(db, "tags"));

    return tagsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }));
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

// Получение статистики поста (устаревшая версия, используется только для обратной совместимости)
export async function getPostStats(postId: string): Promise<PostStats> {
  try {
    // Получаем количество лайков
    const likesQuery = query(
      collection(db, "likes"),
      where("post_id", "==", postId)
    );
    const likesSnapshot = await getDocs(likesQuery);
    const likesCount = likesSnapshot.size;

    // Получаем количество комментариев
    const commentsQuery = query(
      collection(db, "comments"),
      where("post_id", "==", postId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const commentsCount = commentsSnapshot.size;

    // Получаем количество просмотров
    const viewsQuery = query(
      collection(db, "views"),
      where("post_id", "==", postId)
    );
    const viewsSnapshot = await getDocs(viewsQuery);
    const viewsCount = viewsSnapshot.size;

    return {
      likesCount,
      commentsCount,
      viewsCount
    };
  } catch (error) {
    console.error("Error fetching post stats:", error);
    return {
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0
    };
  }
}

// Запись просмотра поста
export async function recordView(postId: string, userId: string): Promise<void> {
  try {
    // Проверяем, просматривал ли пользователь этот пост ранее
    const viewsQuery = query(
      collection(db, "views"),
      where("post_id", "==", postId),
      where("user_id", "==", userId)
    );
    const viewsSnapshot = await getDocs(viewsQuery);

    if (viewsSnapshot.empty) {
      // Записываем просмотр
      await addDoc(collection(db, "views"), {
        post_id: postId,
        user_id: userId,
        created_at: serverTimestamp()
      });

      // Обновляем счетчик просмотров в посте
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);

      if (postDoc.exists()) {
        // Проверяем, существует ли поле viewsCount
        const postData = postDoc.data();
        const currentViews = postData.viewsCount || 0;

        await updateDoc(postRef, {
          viewsCount: currentViews + 1
        });
      }
    }
  } catch (error) {
    console.error("Error recording view:", error);
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
  try {
    // Используем транзакцию для обновления поста и связанных тегов
    const batch = writeBatch(db);

    // Получаем текущую дату в формате Timestamp
    const now = Timestamp.now();

    // Получаем текущие данные поста, чтобы сохранить важные поля
    const postRef = doc(db, "posts", data.id);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      console.error("Post not found:", data.id);
      return false;
    }

    const postData = postDoc.data();

    // Обновляем пост, сохраняя важные поля
    batch.update(postRef, {
      title: data.title || '',
      content: data.content || '',
      category: data.category || 'news',
      // Используем явный Timestamp вместо serverTimestamp()
      updated_at: now,
      // Сохраняем статус архивации
      archived: postData.archived || false,
      // Сохраняем дату создания
      created_at: postData.created_at || now,
      // Сохраняем счетчики
      likesCount: postData.likesCount || 0,
      commentsCount: postData.commentsCount || 0,
      viewsCount: postData.viewsCount || 0
    });

    // Удаляем старые связи с тегами
    const postTagsQuery = query(
      collection(db, "post_tags"),
      where("post_id", "==", data.id)
    );
    const postTagsSnapshot = await getDocs(postTagsQuery);
    postTagsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Добавляем новые теги
    for (const tagName of data.tags) {
      // Проверяем, существует ли тег
      const tagsQuery = query(
        collection(db, "tags"),
        where("name", "==", tagName)
      );
      const tagsSnapshot = await getDocs(tagsQuery);

      let tagId: string;

      if (tagsSnapshot.empty) {
        // Создаем новый тег
        const tagRef = doc(collection(db, "tags"));
        batch.set(tagRef, { name: tagName });
        tagId = tagRef.id;
      } else {
        tagId = tagsSnapshot.docs[0].id;
      }

      // Создаем связь поста с тегом
      const postTagRef = doc(collection(db, "post_tags"));
      batch.set(postTagRef, {
        post_id: data.id,
        tag_id: tagId
      });
    }

    // Выполняем транзакцию
    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error updating post:", error);
    return false;
  }
}

// Удаление комментария (с каскадным удалением дочерних комментариев)
export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    // Получаем информацию о комментарии
    const commentDoc = await getDoc(doc(db, "comments", commentId));

    if (!commentDoc.exists()) {
      console.error("Comment not found:", commentId);
      return false;
    }

    const commentData = commentDoc.data();
    const postId = commentData.post_id;

    // Используем транзакцию для удаления комментария и связанных данных
    const batch = writeBatch(db);

    // Находим все дочерние комментарии (рекурсивно)
    const childCommentIds = await getAllChildCommentIds(commentId);

    // Добавляем текущий комментарий к списку для удаления
    const allCommentIds = [commentId, ...childCommentIds];

    // Удаляем все комментарии
    for (const id of allCommentIds) {
      batch.delete(doc(db, "comments", id));
    }

    // Удаляем лайки всех комментариев
    for (const id of allCommentIds) {
      const commentLikesQuery = query(
        collection(db, "comment_likes"),
        where("comment_id", "==", id)
      );
      const commentLikesSnapshot = await getDocs(commentLikesQuery);
      commentLikesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    // Обновляем счетчик комментариев в посте
    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
      const postData = postDoc.data();
      const currentComments = postData.commentsCount || 0;

      // Убеждаемся, что счетчик не станет отрицательным
      const newCount = Math.max(0, currentComments - allCommentIds.length);

      batch.update(postRef, {
        commentsCount: newCount
      });
    }

    // Выполняем транзакцию
    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    return false;
  }
}

// Рекурсивная функция для получения всех дочерних комментариев
async function getAllChildCommentIds(parentId: string): Promise<string[]> {
  const childIds: string[] = [];

  // Находим прямых потомков
  const childrenQuery = query(
    collection(db, "comments"),
    where("parent_id", "==", parentId)
  );

  const childrenSnapshot = await getDocs(childrenQuery);

  if (childrenSnapshot.empty) {
    return [];
  }

  // Добавляем ID прямых потомков
  const directChildIds = childrenSnapshot.docs.map(doc => doc.id);
  childIds.push(...directChildIds);

  // Рекурсивно находим потомков для каждого прямого потомка
  for (const childId of directChildIds) {
    const nestedChildIds = await getAllChildCommentIds(childId);
    childIds.push(...nestedChildIds);
  }

  return childIds;
}

// Удаление поста
// Получение комментариев к посту
export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  try {
    const commentsQuery = query(
      collection(db, "comments"),
      where("post_id", "==", postId),
      orderBy("created_at", "asc")
    );

    const commentsSnapshot = await getDocs(commentsQuery);

    if (commentsSnapshot.empty) {
      return [];
    }

    // Получаем все ID авторов комментариев
    const authorIds = [...new Set(commentsSnapshot.docs.map(doc => doc.data().author_id))];

    // Получаем данные всех авторов
    const authorMap = new Map();

    for (const authorId of authorIds) {
      const authorDoc = await getDoc(doc(db, "profiles", authorId));
      if (authorDoc.exists()) {
        authorMap.set(authorId, authorDoc.data());
      }
    }

    // Получаем лайки для всех комментариев
    const commentIds = commentsSnapshot.docs.map(doc => doc.id);
    const likesMap = new Map();

    for (const commentId of commentIds) {
      const likesQuery = query(
        collection(db, "comment_likes"),
        where("comment_id", "==", commentId)
      );
      const likesSnapshot = await getDocs(likesQuery);
      likesMap.set(commentId, likesSnapshot.size);
    }

    // Преобразуем комментарии в нужный формат
    const commentMap = new Map();
    const rootComments: Comment[] = [];

    commentsSnapshot.docs.forEach(commentDoc => {
      const commentData = commentDoc.data();
      const author = authorMap.get(commentData.author_id);

      const comment: Comment = {
        id: commentDoc.id,
        content: commentData.content,
        author: {
          username: author?.username || "Unknown",
          role: author?.role || "student"
        },
        created_at: convertTimestampToISO(commentData.created_at),
        parent_id: commentData.parent_id || null,
        replies: [],
        likesCount: likesMap.get(commentDoc.id) || 0
      };

      commentMap.set(commentDoc.id, comment);
    });

    // Строим дерево комментариев
    commentMap.forEach(comment => {
      if (comment.parent_id) {
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

// Добавление комментария
export async function addComment(data: {
  content: string;
  post_id: string;
  author_id: string;
  parent_id?: string;
}): Promise<string | null> {
  try {
    const commentRef = await addDoc(collection(db, "comments"), {
      content: data.content,
      post_id: data.post_id,
      author_id: data.author_id,
      parent_id: data.parent_id || null,
      created_at: serverTimestamp()
    });

    // Обновляем счетчик комментариев в посте
    const postRef = doc(db, "posts", data.post_id);
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
      // Проверяем, существует ли поле commentsCount
      const postData = postDoc.data();
      const currentComments = postData.commentsCount || 0;

      await updateDoc(postRef, {
        commentsCount: currentComments + 1
      });
    }

    return commentRef.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    return null;
  }
}

// Лайк комментария
export async function likeComment(commentId: string, userId: string): Promise<boolean> {
  try {
    // Проверяем, не лайкнул ли пользователь этот комментарий ранее
    const likeQuery = query(
      collection(db, "comment_likes"),
      where("comment_id", "==", commentId),
      where("user_id", "==", userId)
    );

    const likeSnapshot = await getDocs(likeQuery);

    if (!likeSnapshot.empty) {
      // Пользователь уже лайкнул этот комментарий
      return false;
    }

    // Добавляем лайк
    await addDoc(collection(db, "comment_likes"), {
      comment_id: commentId,
      user_id: userId,
      created_at: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error liking comment:", error);
    return false;
  }
}

// Удаление лайка комментария
export async function unlikeComment(commentId: string, userId: string): Promise<boolean> {
  try {
    // Находим лайк пользователя на этот комментарий
    const likeQuery = query(
      collection(db, "comment_likes"),
      where("comment_id", "==", commentId),
      where("user_id", "==", userId)
    );

    const likeSnapshot = await getDocs(likeQuery);

    if (likeSnapshot.empty) {
      // Пользователь не лайкал этот комментарий
      return false;
    }

    // Удаляем лайк
    const batch = writeBatch(db);

    likeSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error unliking comment:", error);
    return false;
  }
}

// Проверка, лайкнул ли пользователь комментарий
export async function hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
  try {
    const likeQuery = query(
      collection(db, "comment_likes"),
      where("comment_id", "==", commentId),
      where("user_id", "==", userId)
    );

    const likeSnapshot = await getDocs(likeQuery);

    return !likeSnapshot.empty;
  } catch (error) {
    console.error("Error checking if user liked comment:", error);
    return false;
  }
}

// Лайк публикации
export async function likePost(postId: string, userId: string): Promise<boolean> {
  try {
    // Проверяем, не лайкнул ли пользователь эту публикацию ранее
    const likeQuery = query(
      collection(db, "likes"),
      where("post_id", "==", postId),
      where("user_id", "==", userId)
    );

    const likeSnapshot = await getDocs(likeQuery);

    if (!likeSnapshot.empty) {
      // Пользователь уже лайкнул эту публикацию - удаляем лайк
      const batch = writeBatch(db);

      likeSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Обновляем счетчик лайков в посте
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);

      if (postDoc.exists()) {
        // Проверяем, существует ли поле likesCount
        const postData = postDoc.data();
        const currentLikes = postData.likesCount || 0;

        // Убеждаемся, что счетчик не станет отрицательным
        if (currentLikes > 0) {
          await updateDoc(postRef, {
            likesCount: increment(-1)
          });
        } else {
          // Если счетчик уже 0, не уменьшаем его
          await updateDoc(postRef, {
            likesCount: 0
          });
        }
      }

      return false; // Возвращаем false, чтобы показать, что лайк был удален
    }

    // Добавляем лайк
    await addDoc(collection(db, "likes"), {
      post_id: postId,
      user_id: userId,
      created_at: serverTimestamp()
    });

    // Обновляем счетчик лайков в посте
    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
      // Проверяем, существует ли поле likesCount
      const postData = postDoc.data();
      const currentLikes = postData.likesCount || 0;

      await updateDoc(postRef, {
        likesCount: currentLikes + 1
      });
    }

    return true; // Возвращаем true, чтобы показать, что лайк был добавлен
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    return false;
  }
}

// Проверка, лайкнул ли пользователь публикацию
export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
  try {
    const likeQuery = query(
      collection(db, "likes"),
      where("post_id", "==", postId),
      where("user_id", "==", userId)
    );

    const likeSnapshot = await getDocs(likeQuery);

    return !likeSnapshot.empty;
  } catch (error) {
    console.error("Error checking if user liked post:", error);
    return false;
  }
}

// Добавление/удаление поста в избранное
export async function toggleBookmark(postId: string, userId: string): Promise<boolean> {
  try {
    // Проверяем, добавил ли пользователь этот пост в избранное ранее
    const bookmarkQuery = query(
      collection(db, "bookmarks"),
      where("post_id", "==", postId),
      where("user_id", "==", userId)
    );

    const bookmarkSnapshot = await getDocs(bookmarkQuery);

    if (!bookmarkSnapshot.empty) {
      // Пользователь уже добавил этот пост в избранное - удаляем
      const batch = writeBatch(db);

      bookmarkSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return false; // Возвращаем false, чтобы показать, что закладка была удалена
    }

    // Добавляем в избранное
    await addDoc(collection(db, "bookmarks"), {
      post_id: postId,
      user_id: userId,
      created_at: serverTimestamp()
    });

    return true; // Возвращаем true, чтобы показать, что закладка была добавлена
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return false;
  }
}

// Проверка, добавил ли пользователь пост в избранное
export async function hasUserBookmarkedPost(postId: string, userId: string): Promise<boolean> {
  try {
    const bookmarkQuery = query(
      collection(db, "bookmarks"),
      where("post_id", "==", postId),
      where("user_id", "==", userId)
    );

    const bookmarkSnapshot = await getDocs(bookmarkQuery);

    return !bookmarkSnapshot.empty;
  } catch (error) {
    console.error("Error checking if user bookmarked post:", error);
    return false;
  }
}

// Получение всех избранных постов пользователя
export async function getBookmarkedPosts(userId: string): Promise<Post[]> {
  try {
    // Получаем все закладки пользователя
    const bookmarksQuery = query(
      collection(db, "bookmarks"),
      where("user_id", "==", userId),
      orderBy("created_at", "desc")
    );

    const bookmarksSnapshot = await getDocs(bookmarksQuery);

    if (bookmarksSnapshot.empty) {
      return [];
    }

    // Получаем ID всех закладок
    const postIds = bookmarksSnapshot.docs.map(doc => doc.data().post_id);

    // Получаем данные всех постов
    const posts: Post[] = [];

    for (const postId of postIds) {
      const postDoc = await getDoc(doc(db, "posts", postId));
      if (postDoc.exists()) {
        const postData = postDoc.data();
        const authorId = postData.author_id;

        // Получаем автора
        let authorData = null;
        if (authorId) {
          const authorDoc = await getDoc(doc(db, "profiles", authorId));
          if (authorDoc.exists()) {
            authorData = authorDoc.data();
          }
        }

        // Получаем теги
        const postTagsQuery = query(
          collection(db, "post_tags"),
          where("post_id", "==", postId)
        );
        const postTagsSnapshot = await getDocs(postTagsQuery);
        const tagIds = postTagsSnapshot.docs.map(doc => doc.data().tag_id);

        const tags: string[] = [];
        for (const tagId of tagIds) {
          const tagDoc = await getDoc(doc(db, "tags", tagId));
          if (tagDoc.exists()) {
            tags.push(tagDoc.data().name);
          }
        }

        // Получаем статистику
        const stats = await getPostStats(postId);

        posts.push({
          id: postId,
          title: postData.title,
          content: postData.content,
          author: {
            username: authorData?.username || "Unknown",
            role: authorData?.role || "student"
          },
          created_at: convertTimestampToISO(postData.created_at),
          category: postData.category,
          tags,
          likesCount: stats.likesCount,
          commentsCount: stats.commentsCount,
          viewsCount: stats.viewsCount,
          archived: postData.archived || false,
        pinned: postData.pinned || false
        });
      }
    }

    return posts;
  } catch (error) {
    console.error("Error fetching bookmarked posts:", error);
    return [];
  }
}

// Архивирование поста
export async function archivePost(postId: string): Promise<boolean> {
  try {
    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      console.error("Post not found:", postId);
      return false;
    }

    // Обновляем пост, устанавливая поле archived в true
    await updateDoc(postRef, {
      archived: true,
      updated_at: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error archiving post:", error);
    return false;
  }
}

// Восстановление поста из архива
export async function unarchivePost(postId: string): Promise<boolean> {
  try {
    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      console.error("Post not found:", postId);
      return false;
    }

    // Обновляем пост, устанавливая поле archived в false
    await updateDoc(postRef, {
      archived: false,
      updated_at: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error unarchiving post:", error);
    return false;
  }
}

// Закрепление/открепление поста
export async function togglePinPost(postId: string): Promise<boolean> {
  try {
    // Проверяем, существует ли пост
    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      console.error("Post not found:", postId);
      return false;
    }

    // Получаем текущего пользователя
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      return false;
    }

    // Получаем профиль пользователя для проверки роли
    const userProfileRef = doc(db, "profiles", currentUser.uid);
    const userProfileDoc = await getDoc(userProfileRef);

    if (!userProfileDoc.exists()) {
      console.error("User profile not found");
      return false;
    }

    const userProfile = userProfileDoc.data();

    // Проверяем права доступа (только учителя и администраторы могут закреплять публикации)
    const isTeacherOrAdmin = userProfile.role === "teacher" || userProfile.role === "admin";

    if (!isTeacherOrAdmin) {
      console.error("User does not have permission to pin posts");
      return false;
    }

    // Получаем текущее состояние закрепления
    const postData = postDoc.data();
    const isPinned = postData.pinned || false;

    // Обновляем пост, меняя состояние закрепления на противоположное
    await updateDoc(postRef, {
      pinned: !isPinned,
      updated_at: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error toggling pin status:", error);
    return false;
  }
}

export async function deletePost(postId: string): Promise<boolean> {
  try {
    // Проверяем, существует ли пост
    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      console.error("Post not found:", postId);
      return false;
    }

    // Получаем текущего пользователя
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("User not authenticated");
      return false;
    }

    // Получаем профиль пользователя для проверки роли
    const userProfileRef = doc(db, "profiles", currentUser.uid);
    const userProfileDoc = await getDoc(userProfileRef);

    if (!userProfileDoc.exists()) {
      console.error("User profile not found");
      return false;
    }

    const userProfile = userProfileDoc.data();
    const postData = postDoc.data();

    // Проверяем права доступа
    const isAuthor = postData.author_id === currentUser.uid;
    const isTeacherOrAdmin = userProfile.role === "teacher" || userProfile.role === "admin";

    if (!isAuthor && !isTeacherOrAdmin) {
      console.error("User does not have permission to delete this post");
      return false;
    }

    // Используем транзакцию для удаления поста и связанных данных
    const batch = writeBatch(db);

    // Удаляем пост
    batch.delete(postRef);

    // Удаляем связи с тегами
    const postTagsQuery = query(
      collection(db, "post_tags"),
      where("post_id", "==", postId)
    );
    const postTagsSnapshot = await getDocs(postTagsQuery);
    postTagsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Удаляем лайки поста
    const likesQuery = query(
      collection(db, "likes"),
      where("post_id", "==", postId)
    );
    const likesSnapshot = await getDocs(likesQuery);
    likesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Удаляем просмотры поста
    const viewsQuery = query(
      collection(db, "views"),
      where("post_id", "==", postId)
    );
    const viewsSnapshot = await getDocs(viewsQuery);
    viewsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Находим все комментарии к посту
    const commentsQuery = query(
      collection(db, "comments"),
      where("post_id", "==", postId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);

    // Получаем ID всех комментариев
    const commentIds = commentsSnapshot.docs.map(doc => doc.id);

    // Удаляем комментарии
    commentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Удаляем лайки комментариев
    if (commentIds.length > 0) {
      for (const commentId of commentIds) {
        const commentLikesQuery = query(
          collection(db, "comment_likes"),
          where("comment_id", "==", commentId)
        );
        const commentLikesSnapshot = await getDocs(commentLikesQuery);
        commentLikesSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }
    }

    // Выполняем транзакцию
    await batch.commit();

    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}