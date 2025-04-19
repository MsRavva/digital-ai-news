'use server'

import firebaseAdmin, { db } from '@/lib/firebase-admin';

/**
 * Серверное действие для удаления публикации
 * @param postId ID публикации для удаления
 * @param userId ID пользователя, который пытается удалить публикацию
 * @returns Объект с результатом операции
 */
export async function deletePostAction(postId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Deleting post ${postId} by user ${userId}`);

  // Проверяем, что Firebase Admin SDK инициализирован
  if (!db) {
    console.error('Firestore is not initialized');
    return { success: false, error: 'Database connection error' };
  }

  try {
    // Получаем пост
    const postDoc = await db.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      console.error(`Post ${postId} not found`);
      return { success: false, error: 'Post not found' };
    }

    const postData = postDoc.data();

    // Получаем профиль пользователя
    const userProfileDoc = await db.collection('profiles').doc(userId).get();

    if (!userProfileDoc.exists) {
      console.error(`User profile ${userId} not found`);
      return { success: false, error: 'User profile not found' };
    }

    const userProfile = userProfileDoc.data();

    // Проверяем права доступа
    const isAuthor = postData?.author_id === userId;
    const isTeacherOrAdmin = userProfile.role === 'teacher' || userProfile.role === 'admin';

    if (!isAuthor && !isTeacherOrAdmin) {
      console.error(`User ${userId} does not have permission to delete post ${postId}`);
      return { success: false, error: 'Permission denied' };
    }

    // Используем batch для удаления поста и связанных данных
    const batch = db.batch();

    // Удаляем пост
    batch.delete(db.collection('posts').doc(postId));

    // Удаляем связи с тегами
    const postTagsSnapshot = await db.collection('post_tags')
      .where('post_id', '==', postId)
      .get();

    postTagsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Удаляем лайки поста
    const likesSnapshot = await db.collection('likes')
      .where('post_id', '==', postId)
      .get();

    likesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Удаляем просмотры поста
    const viewsSnapshot = await db.collection('views')
      .where('post_id', '==', postId)
      .get();

    viewsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Находим все комментарии к посту
    const commentsSnapshot = await db.collection('comments')
      .where('post_id', '==', postId)
      .get();

    // Получаем ID всех комментариев
    const commentIds = commentsSnapshot.docs.map(doc => doc.id);

    // Удаляем комментарии
    commentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Удаляем лайки комментариев
    for (const commentId of commentIds) {
      const commentLikesSnapshot = await db.collection('comment_likes')
        .where('comment_id', '==', commentId)
        .get();

      commentLikesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    // Выполняем транзакцию
    await batch.commit();

    console.log(`Successfully deleted post ${postId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);

    // Более подробное логирование ошибки
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      // Проверяем на ошибку инициализации Firebase
      if (error.message.includes('Firebase') || error.message.includes('firestore')) {
        return {
          success: false,
          error: 'Database connection error. Please try again later.',
        };
      }

      return { success: false, error: error.message };
    }

    return { success: false, error: 'Unknown error' };
  }
}
