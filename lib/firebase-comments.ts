import { db } from "./firebase"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
  updateDoc,
  increment,
} from "firebase/firestore"
import type { Comment } from "@/types/database"

// Вспомогательная функция для преобразования Timestamp в ISO строку
function convertTimestampToISO(timestamp: Timestamp | any): string {
  if (!timestamp) {
    return new Date().toISOString()
  }

  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toISOString()
  }

  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString()
  }

  return new Date(timestamp).toISOString()
}

// Получение комментариев по ID поста
export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return []
    }
    const commentsQuery = query(
      collection(db, "comments"),
      where("post_id", "==", postId),
      orderBy("created_at", "asc"),
    )

    const commentsSnapshot = await getDocs(commentsQuery)

    if (commentsSnapshot.empty) {
      return []
    }

    // Получаем все ID авторов комментариев
    const authorIds = [
      ...new Set(commentsSnapshot.docs.map((doc) => doc.data().author_id)),
    ]

    // Получаем данные всех авторов
    const authorMap = new Map()

    for (const authorId of authorIds) {
      const authorDoc = await getDoc(doc(db, "profiles", authorId))
      if (authorDoc.exists()) {
        authorMap.set(authorId, authorDoc.data())
      }
    }

    // Получаем лайки для всех комментариев
    const commentIds = commentsSnapshot.docs.map((doc) => doc.id)
    const likesMap = new Map()

    for (const commentId of commentIds) {
      const likesQuery = query(
        collection(db, "comment_likes"),
        where("comment_id", "==", commentId),
      )
      const likesSnapshot = await getDocs(likesQuery)
      likesMap.set(commentId, likesSnapshot.size)
    }

    // Преобразуем комментарии в нужный формат
    const commentMap = new Map()
    const rootComments: Comment[] = []

    commentsSnapshot.docs.forEach((commentDoc) => {
      const commentData = commentDoc.data()
      const author = authorMap.get(commentData.author_id)

      const comment: Comment = {
        id: commentDoc.id,
        content: commentData.content,
        author: {
          username: author?.username || "Unknown",
          role: author?.role || "student",
        },
        created_at: convertTimestampToISO(commentData.created_at),
        parent_id: commentData.parent_id || null,
        replies: [],
        likesCount: likesMap.get(commentDoc.id) || 0,
      }

      commentMap.set(commentDoc.id, comment)
    })

    // Строим дерево комментариев
    commentMap.forEach((comment) => {
      if (comment.parent_id) {
        const parentComment = commentMap.get(comment.parent_id)
        if (parentComment) {
          parentComment.replies.push(comment)
        }
      } else {
        rootComments.push(comment)
      }
    })

    return rootComments
  } catch (error) {
    console.error("Error fetching comments:", error)
    return []
  }
}

// Добавление комментария
export async function addComment(data: {
  content: string
  post_id: string
  author_id: string
  parent_id?: string
}): Promise<string | null> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return null
    }
    const batch = writeBatch(db)

    // Добавляем комментарий
    const commentRef = doc(collection(db, "comments"))
    batch.set(commentRef, {
      content: data.content,
      post_id: data.post_id,
      author_id: data.author_id,
      parent_id: data.parent_id || null,
      created_at: serverTimestamp(),
    })

    // Обновляем счетчик комментариев в посте
    const postRef = doc(db, "posts", data.post_id)
    const postDoc = await getDoc(postRef)

    if (postDoc.exists()) {
      const postData = postDoc.data()
      const currentComments = postData.commentsCount || 0
      batch.update(postRef, {
        commentsCount: increment(1),
      })
    }

    await batch.commit()
    return commentRef.id
  } catch (error) {
    console.error("Error adding comment:", error)
    return null
  }
}

// Рекурсивная функция для получения всех дочерних комментариев
async function getAllChildCommentIds(parentId: string, postId: string): Promise<string[]> {
  if (!db) {
    console.error("Firestore is not initialized")
    return []
  }
  const childIds: string[] = []

  // Находим прямых потомков
  const childrenQuery = query(
    collection(db, "comments"),
    where("post_id", "==", postId),
    where("parent_id", "==", parentId),
  )

  const childrenSnapshot = await getDocs(childrenQuery)

  if (childrenSnapshot.empty) {
    return []
  }

  // Добавляем ID прямых потомков
  const directChildIds = childrenSnapshot.docs.map((doc) => doc.id)
  childIds.push(...directChildIds)

  // Рекурсивно находим потомков для каждого прямого потомка
  for (const childId of directChildIds) {
    const nestedChildIds = await getAllChildCommentIds(childId, postId)
    childIds.push(...nestedChildIds)
  }

  return childIds
}

// Удаление комментария и всех его ответов
export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
    // Получаем данные комментария для получения post_id
    const commentDoc = await getDoc(doc(db, "comments", commentId))
    if (!commentDoc.exists()) {
      return false
    }

    const commentData = commentDoc.data()
    const postId = commentData.post_id

    // Находим все дочерние комментарии (рекурсивно)
    const childCommentIds = await getAllChildCommentIds(commentId, postId)

    // Добавляем текущий комментарий к списку для удаления
    const allCommentIds = [commentId, ...childCommentIds]

    // Удаляем все комментарии и их лайки
    const batch = writeBatch(db)

    for (const idToDelete of allCommentIds) {
      // Удаляем комментарий
      batch.delete(doc(db, "comments", idToDelete))

      // Удаляем все лайки этого комментария
      const likesQuery = query(
        collection(db, "comment_likes"),
        where("comment_id", "==", idToDelete),
      )
      const likesSnapshot = await getDocs(likesQuery)
      likesSnapshot.docs.forEach((likeDoc) => {
        batch.delete(likeDoc.ref)
      })
    }

    // Обновляем счетчик комментариев в посте
    const postRef = doc(db, "posts", postId)
    const postDoc = await getDoc(postRef)

    if (postDoc.exists()) {
      const postData = postDoc.data()
      const currentComments = postData.commentsCount || 0

      // Убеждаемся, что счетчик не станет отрицательным
      const newCount = Math.max(0, currentComments - allCommentIds.length)

      batch.update(postRef, {
        commentsCount: newCount,
      })
    }

    await batch.commit()
    return true
  } catch (error) {
    console.error("Error deleting comment:", error)
    return false
  }
}

// Лайк комментария
export async function likeComment(
  commentId: string,
  userId: string,
): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
    // Проверяем, не лайкнул ли пользователь этот комментарий ранее
    const likeQuery = query(
      collection(db, "comment_likes"),
      where("comment_id", "==", commentId),
      where("user_id", "==", userId),
    )

    const likeSnapshot = await getDocs(likeQuery)

    if (!likeSnapshot.empty) {
      // Пользователь уже лайкнул этот комментарий
      return false
    }

    // Добавляем лайк
    await addDoc(collection(db, "comment_likes"), {
      comment_id: commentId,
      user_id: userId,
      created_at: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error liking comment:", error)
    return false
  }
}

// Удаление лайка комментария
export async function unlikeComment(
  commentId: string,
  userId: string,
): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
    // Находим лайк пользователя на этот комментарий
    const likeQuery = query(
      collection(db, "comment_likes"),
      where("comment_id", "==", commentId),
      where("user_id", "==", userId),
    )

    const likeSnapshot = await getDocs(likeQuery)

    if (likeSnapshot.empty) {
      // Пользователь не лайкал этот комментарий
      return false
    }

    // Удаляем лайк
    const batch = writeBatch(db)

    likeSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()

    return true
  } catch (error) {
    console.error("Error unliking comment:", error)
    return false
  }
}

// Проверка, лайкнул ли пользователь комментарий
export async function hasUserLikedComment(
  commentId: string,
  userId: string,
): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
    const likeQuery = query(
      collection(db, "comment_likes"),
      where("comment_id", "==", commentId),
      where("user_id", "==", userId),
    )

    const likeSnapshot = await getDocs(likeQuery)

    return !likeSnapshot.empty
  } catch (error) {
    console.error("Error checking if user liked comment:", error)
    return false
  }
}

