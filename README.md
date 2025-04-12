# AI News aka digital-ai-news

Платформа для публикации новостей и обсуждения веб-разработки с ИИ.

## Технологии

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Firebase (Auth, Firestore, Storage)
- shadcn/ui

## Настройка проекта

### Предварительные требования

- Node.js 18+ 
- pnpm

### Установка

1. Клонируйте репозиторий:

```bash
git clone <url-репозитория>
cd ai-news
```

2. Установите зависимости:

```bash
pnpm install
```

3. Настройте Firebase:

   - Создайте проект в [Firebase Console](https://console.firebase.google.com/)
   - Включите Authentication, Firestore и Storage
   - Создайте веб-приложение и получите конфигурацию
   - Скопируйте файл `.env.local.example` в `.env.local` и заполните его данными из Firebase:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

4. Настройте правила безопасности в Firebase:

   - Firestore:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Профили доступны для чтения всем, но редактировать может только владелец
       match /profiles/{userId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Посты доступны для чтения всем, создавать могут авторизованные пользователи
       match /posts/{postId} {
         allow read: if true;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.author_id;
       }
       
       // Теги доступны для чтения всем, создавать могут авторизованные пользователи
       match /tags/{tagId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       
       // Связи постов с тегами
       match /post_tags/{postTagId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       
       // Комментарии доступны для чтения всем, создавать могут авторизованные пользователи
       match /comments/{commentId} {
         allow read: if true;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.author_id;
       }
       
       // Лайки и просмотры
       match /likes/{likeId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       
       match /views/{viewId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

   - Storage:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

### Запуск проекта

Для запуска проекта в режиме разработки:

```bash
pnpm dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

## Структура проекта

- `/app` - Маршруты и страницы Next.js
- `/components` - React компоненты
- `/context` - Контексты React, включая AuthContext
- `/lib` - Утилиты и сервисы для работы с Firebase
- `/public` - Статические файлы
- `/types` - TypeScript типы

## Миграция с Supabase на Firebase

Если вы мигрируете с Supabase на Firebase, вы можете использовать скрипт миграции:

```bash
npx ts-node scripts/migrate-to-firebase.ts
```

Перед запуском убедитесь, что у вас настроены переменные окружения как для Firebase, так и для Supabase.

## Лицензия

MIT
