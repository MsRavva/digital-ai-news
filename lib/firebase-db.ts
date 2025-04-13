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
  DocumentData,
  QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { Post, Comment, Tag, PostStats } from "@/types/database";

// Преобразование Timestamp в строку ISO
const convertTimestampToISO = (timestamp: Timestamp): string => {
  return timestamp.toDate().toISOString();
};

// Получение всех постов
export async function getPosts(category?: string): Promise<Post[]> {
  try {
    let postsQuery = collection(db, "posts");

    if (category) {
      postsQuery = query(
        postsQuery,
        where("category", "==", category),
        orderBy("created_at", "desc")
      );
    } else {
      postsQuery = query(
        postsQuery,
        orderBy("created_at", "desc")
      );
    }

    const postsSnapshot = await getDocs(postsQuery);
    const posts: Post[] = [];

    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();

      // Получаем автора
      const authorDoc = await getDoc(doc(db, "profiles", postData.author_id));
      const authorData = authorDoc.data();

      // Получаем теги
      const postTagsQuery = query(
        collection(db, "post_tags"),
        where("post_id", "==", postDoc.id)
      );
      const postTagsSnapshot = await getDocs(postTagsQuery);

      const tagIds = postTagsSnapshot.docs.map(doc => doc.data().tag_id);
      const tags: string[] = [];

      if (tagIds.length > 0) {
        for (const tagId of tagIds) {
          const tagDoc = await getDoc(doc(db, "tags", tagId));
          if (tagDoc.exists()) {
            tags.push(tagDoc.data().name);
          }
        }
      }

      // Получаем статистику
      const stats = await getPostStats(postDoc.id);

      posts.push({
        id: postDoc.id,
        title: postData.title,
        content: postData.content,
        author: {
          username: authorData?.username || "Unknown",
          role: authorData?.role || "student"
        },
        created_at: convertTimestampToISO(postData.created_at),
        category: postData.category,
        tags,
        ...stats
      });
    }

    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// Получение поста по ID
export async function getPostById(id: string): Promise<Post | null> {
  try {
    const postDoc = await getDoc(doc(db, "posts", id));

    if (!postDoc.exists()) {
      return null;
    }

    const postData = postDoc.data();

    // Получаем автора
    const authorDoc = await getDoc(doc(db, "profiles", postData.author_id));
    const authorData = authorDoc.data();

    // Получаем теги
    const postTagsQuery = query(
      collection(db, "post_tags"),
      where("post_id", "==", id)
    );
    const postTagsSnapshot = await getDocs(postTagsQuery);

    const tagIds = postTagsSnapshot.docs.map(doc => doc.data().tag_id);
    const tags: string[] = [];

    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        const tagDoc = await getDoc(doc(db, "tags", tagId));
        if (tagDoc.exists()) {
          tags.push(tagDoc.data().name);
        }
      }
    }

    // Получаем статистику
    const stats = await getPostStats(id);

    return {
      id: postDoc.id,
      title: postData.title,
      content: postData.content,
      author: {
        username: authorData?.username || "Unknown",
        role: authorData?.role || "student"
      },
      created_at: convertTimestampToISO(postData.created_at),
      category: postData.category,
      tags,
      ...stats
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

// Создание нового поста
export async function createPost(data: {
  title: string;
  content: string;
  category: string;
  author_id: string;
  tags: string[];
}): Promise<string | null> {
  try {
    // Используем транзакцию для создания поста и связанных тегов
    const batch = writeBatch(db);

    // Создаем пост
    const postRef = doc(collection(db, "posts"));
    batch.set(postRef, {
      title: data.title,
      content: data.content,
      category: data.category,
      author_id: data.author_id,
      created_at: serverTimestamp()
    });

    // Обрабатываем теги
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
        post_id: postRef.id,
        tag_id: tagId
      });
    }

    // Выполняем транзакцию
    await batch.commit();

    return postRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    return null;
  }
}

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
      await updateDoc(postRef, {
        commentsCount: increment(1)
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
      await updateDoc(postRef, {
        likesCount: increment(-1)
      });

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
    await updateDoc(postRef, {
      likesCount: increment(1)
    });

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

// Получение статистики поста
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
      await updateDoc(postRef, {
        viewsCount: increment(1)
      });
    }
  } catch (error) {
    console.error("Error recording view:", error);
  }
}
