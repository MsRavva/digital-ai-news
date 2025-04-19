import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

// Инициализация Firestore
const db = admin.firestore();

export async function POST(request: NextRequest) {
  console.log('API route /api/posts/delete called');
  try {
    // Получаем данные запроса
    const data = await request.json();
    const { postId, userId } = data;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Получаем пост
    const postDoc = await db.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const postData = postDoc.data();

    // Получаем профиль пользователя
    const userProfileDoc = await db.collection('profiles').doc(userId).get();

    if (!userProfileDoc.exists) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userProfile = userProfileDoc.data();

    // Проверяем права доступа
    const isAuthor = postData?.author_id === userId;
    const isTeacherOrAdmin = userProfile.role === 'teacher' || userProfile.role === 'admin';

    if (!isAuthor && !isTeacherOrAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);

    // Более подробное логирование ошибки
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Возвращаем ошибку в формате JSON
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    );
  }
}
