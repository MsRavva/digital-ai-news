import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Получаем все публикации в категории "project-ideas"
    const snapshot = await db.collection('posts')
      .where('category', '==', 'project-ideas')
      .get();
    
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
