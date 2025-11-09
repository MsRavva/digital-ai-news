import { doc, getDoc, updateDoc, deleteDoc, writeBatch, collection, query, where, getDocs, serverTimestamp, addDoc, increment } from "firebase/firestore"
import { db } from "./firebase"

// Закрепление/открепление поста
export async function togglePinPost(postId: string): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
    const postRef = doc(db, "posts", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      console.error("Post not found:", postId)
      return false
    }

    const currentPinned = postDoc.data().pinned || false

    await updateDoc(postRef, {
      pinned: !currentPinned,
      updated_at: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error toggling pin:", error)
    return false
  }
}

// Архивирование поста
export async function archivePost(postId: string): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
    const postRef = doc(db, "posts", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      console.error("Post not found:", postId)
      return false
    }

    await updateDoc(postRef, {
      archived: true,
      updated_at: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error archiving post:", error)
    return false
  }
}

// Восстановление поста из архива
export async function unarchivePost(postId: string): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
    const postRef = doc(db, "posts", postId)
    const postDoc = await getDoc(postRef)

    if (!postDoc.exists()) {
      console.error("Post not found:", postId)
      return false
    }

    await updateDoc(postRef, {
      archived: false,
      updated_at: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error unarchiving post:", error)
    return false
  }
}

// Удаление поста
export async function deletePost(postId: string): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
    const batch = writeBatch(db)

    // Удаляем пост
    const postRef = doc(db, "posts", postId)
    batch.delete(postRef)

    // Удаляем связи с тегами
    const postTagsQuery = query(
      collection(db, "post_tags"),
      where("post_id", "==", postId)
    )
    const postTagsSnapshot = await getDocs(postTagsQuery)
    postTagsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Удаляем лайки
    const likesQuery = query(
      collection(db, "likes"),
      where("post_id", "==", postId)
    )
    const likesSnapshot = await getDocs(likesQuery)
    likesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Удаляем комментарии
    const commentsQuery = query(
      collection(db, "comments"),
      where("post_id", "==", postId)
    )
    const commentsSnapshot = await getDocs(commentsQuery)
    commentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Удаляем просмотры
    const viewsQuery = query(
      collection(db, "views"),
      where("post_id", "==", postId)
    )
    const viewsSnapshot = await getDocs(viewsQuery)
    viewsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
    return true
  } catch (error) {
    console.error("Error deleting post:", error)
    return false
  }
}

// Лайк публикации
export async function likePost(
  postId: string,
  userId: string,
): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
    // Проверяем, не лайкнул ли пользователь эту публикацию ранее
    const likeQuery = query(
      collection(db, "likes"),
      where("post_id", "==", postId),
      where("user_id", "==", userId),
    )

    const likeSnapshot = await getDocs(likeQuery)

    if (!likeSnapshot.empty) {
      // Пользователь уже лайкнул эту публикацию - удаляем лайк
      const batch = writeBatch(db)

      likeSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })

      await batch.commit()

      // Обновляем счетчик лайков в посте
      const postRef = doc(db, "posts", postId)
      const postDoc = await getDoc(postRef)

      if (postDoc.exists()) {
        // Проверяем, существует ли поле likesCount
        const postData = postDoc.data()
        const currentLikes = postData.likesCount || 0

        // Убеждаемся, что счетчик не станет отрицательным
        if (currentLikes > 0) {
          await updateDoc(postRef, {
            likesCount: increment(-1),
          })
        } else {
          // Если счетчик уже 0, не уменьшаем его
          await updateDoc(postRef, {
            likesCount: 0,
          })
        }
      }

      return false // Возвращаем false, чтобы показать, что лайк был удален
    }

    // Добавляем лайк
    await addDoc(collection(db, "likes"), {
      post_id: postId,
      user_id: userId,
      created_at: serverTimestamp(),
    })

    // Обновляем счетчик лайков в посте
    const postRef = doc(db, "posts", postId)
    const postDoc = await getDoc(postRef)

    if (postDoc.exists()) {
      // Проверяем, существует ли поле likesCount
      const postData = postDoc.data()
      const currentLikes = postData.likesCount || 0

      await updateDoc(postRef, {
        likesCount: increment(1),
      })
    }

    return true // Возвращаем true, чтобы показать, что лайк был добавлен
  } catch (error) {
    console.error("Error liking/unliking post:", error)
    return false
  }
}

// Проверка, лайкнул ли пользователь публикацию
export async function hasUserLikedPost(
  postId: string,
  userId: string,
): Promise<boolean> {
  try {
    if (!db) {
      console.error("Firestore is not initialized")
      return false
    }
    const likeQuery = query(
      collection(db, "likes"),
      where("post_id", "==", postId),
      where("user_id", "==", userId),
    )

    const likeSnapshot = await getDocs(likeQuery)

    return !likeSnapshot.empty
  } catch (error) {
    console.error("Error checking if user liked post:", error)
    return false
  }
}

