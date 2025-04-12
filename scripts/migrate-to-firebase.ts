/**
 * Скрипт для миграции данных из Supabase в Firebase
 * 
 * Для запуска:
 * 1. Заполните .env.local файл с конфигурацией Firebase
 * 2. Убедитесь, что переменные окружения Supabase также настроены
 * 3. Запустите: npx ts-node scripts/migrate-to-firebase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Конфигурация Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Инициализация Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

// Инициализация Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateUsers() {
  console.log('Миграция пользователей...');
  
  // Получаем пользователей из Supabase
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Ошибка при получении пользователей из Supabase:', error);
    return;
  }
  
  console.log(`Найдено ${users.users.length} пользователей в Supabase`);
  
  // Мигрируем каждого пользователя
  for (const user of users.users) {
    try {
      // Создаем пользователя в Firebase Auth
      // Примечание: в реальном сценарии вам нужно будет использовать Firebase Admin SDK
      // для импорта пользователей с их хешами паролей
      console.log(`Миграция пользователя ${user.email}`);
      
      // Получаем профиль пользователя из Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        // Сохраняем профиль в Firestore
        await setDoc(doc(db, 'profiles', user.id), {
          id: user.id,
          username: profile.username,
          role: profile.role,
          created_at: profile.created_at
        });
        
        console.log(`Профиль пользователя ${user.email} успешно мигрирован`);
      }
    } catch (error) {
      console.error(`Ошибка при миграции пользователя ${user.email}:`, error);
    }
  }
}

async function migratePosts() {
  console.log('Миграция постов...');
  
  // Получаем посты из Supabase
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*');
  
  if (error) {
    console.error('Ошибка при получении постов из Supabase:', error);
    return;
  }
  
  console.log(`Найдено ${posts.length} постов в Supabase`);
  
  // Мигрируем каждый пост
  for (const post of posts) {
    try {
      console.log(`Миграция поста ${post.id}`);
      
      // Сохраняем пост в Firestore
      await setDoc(doc(db, 'posts', post.id), {
        title: post.title,
        content: post.content,
        category: post.category,
        author_id: post.author_id,
        created_at: new Date(post.created_at)
      });
      
      // Получаем теги поста
      const { data: postTags } = await supabase
        .from('post_tags')
        .select('tag_id')
        .eq('post_id', post.id);
      
      if (postTags && postTags.length > 0) {
        // Мигрируем связи поста с тегами
        const batch = writeBatch(db);
        
        for (const postTag of postTags) {
          const postTagRef = doc(collection(db, 'post_tags'));
          batch.set(postTagRef, {
            post_id: post.id,
            tag_id: postTag.tag_id
          });
        }
        
        await batch.commit();
      }
      
      console.log(`Пост ${post.id} успешно мигрирован`);
    } catch (error) {
      console.error(`Ошибка при миграции поста ${post.id}:`, error);
    }
  }
}

async function migrateTags() {
  console.log('Миграция тегов...');
  
  // Получаем теги из Supabase
  const { data: tags, error } = await supabase
    .from('tags')
    .select('*');
  
  if (error) {
    console.error('Ошибка при получении тегов из Supabase:', error);
    return;
  }
  
  console.log(`Найдено ${tags.length} тегов в Supabase`);
  
  // Мигрируем каждый тег
  const batch = writeBatch(db);
  
  for (const tag of tags) {
    try {
      console.log(`Миграция тега ${tag.id}`);
      
      // Сохраняем тег в Firestore
      batch.set(doc(db, 'tags', tag.id), {
        name: tag.name
      });
    } catch (error) {
      console.error(`Ошибка при миграции тега ${tag.id}:`, error);
    }
  }
  
  await batch.commit();
  console.log('Теги успешно мигрированы');
}

async function migrateComments() {
  console.log('Миграция комментариев...');
  
  // Получаем комментарии из Supabase
  const { data: comments, error } = await supabase
    .from('comments')
    .select('*');
  
  if (error) {
    console.error('Ошибка при получении комментариев из Supabase:', error);
    return;
  }
  
  console.log(`Найдено ${comments.length} комментариев в Supabase`);
  
  // Мигрируем каждый комментарий
  for (const comment of comments) {
    try {
      console.log(`Миграция комментария ${comment.id}`);
      
      // Сохраняем комментарий в Firestore
      await setDoc(doc(db, 'comments', comment.id), {
        content: comment.content,
        post_id: comment.post_id,
        author_id: comment.author_id,
        parent_id: comment.parent_id,
        created_at: new Date(comment.created_at)
      });
      
      console.log(`Комментарий ${comment.id} успешно мигрирован`);
    } catch (error) {
      console.error(`Ошибка при миграции комментария ${comment.id}:`, error);
    }
  }
}

async function migrateLikesAndViews() {
  console.log('Миграция лайков и просмотров...');
  
  // Получаем лайки из Supabase
  const { data: likes, error: likesError } = await supabase
    .from('likes')
    .select('*');
  
  if (likesError) {
    console.error('Ошибка при получении лайков из Supabase:', likesError);
  } else {
    console.log(`Найдено ${likes.length} лайков в Supabase`);
    
    // Мигрируем лайки
    const likesBatch = writeBatch(db);
    
    for (const like of likes) {
      try {
        const likeRef = doc(collection(db, 'likes'));
        likesBatch.set(likeRef, {
          post_id: like.post_id,
          user_id: like.user_id
        });
      } catch (error) {
        console.error(`Ошибка при миграции лайка:`, error);
      }
    }
    
    await likesBatch.commit();
    console.log('Лайки успешно мигрированы');
  }
  
  // Получаем просмотры из Supabase
  const { data: views, error: viewsError } = await supabase
    .from('views')
    .select('*');
  
  if (viewsError) {
    console.error('Ошибка при получении просмотров из Supabase:', viewsError);
  } else {
    console.log(`Найдено ${views.length} просмотров в Supabase`);
    
    // Мигрируем просмотры
    const viewsBatch = writeBatch(db);
    
    for (const view of views) {
      try {
        const viewRef = doc(collection(db, 'views'));
        viewsBatch.set(viewRef, {
          post_id: view.post_id,
          user_id: view.user_id,
          created_at: new Date()
        });
      } catch (error) {
        console.error(`Ошибка при миграции просмотра:`, error);
      }
    }
    
    await viewsBatch.commit();
    console.log('Просмотры успешно мигрированы');
  }
}

async function runMigration() {
  try {
    console.log('Начало миграции данных из Supabase в Firebase...');
    
    // Выполняем миграцию в правильном порядке
    await migrateTags();
    await migrateUsers();
    await migratePosts();
    await migrateComments();
    await migrateLikesAndViews();
    
    console.log('Миграция успешно завершена!');
  } catch (error) {
    console.error('Ошибка при миграции:', error);
  }
}

// Запускаем миграцию
runMigration();
