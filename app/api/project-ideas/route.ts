import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    // Получаем все публикации в категории "project-ideas"
    const postsQuery = query(
      collection(db, 'posts'),
      where('category', '==', 'project-ideas')
    );

    const snapshot = await getDocs(postsQuery);

    if (snapshot.empty) {
      return NextResponse.json({ message: 'Публикации не найдены' }, { status: 404 });
    }

    // Разделяем на активные и архивированные
    const active = [];
    const archived = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const item = {
        id: doc.id,
        title: data.title,
        archived: data.archived || false
      };

      if (data.archived) {
        archived.push(item);
      } else {
        active.push(item);
      }
    });

    return NextResponse.json({
      active,
      archived,
      total: active.length + archived.length
    });

  } catch (error) {
    console.error('Ошибка при получении списка идей проектов:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
