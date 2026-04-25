# Appwrite Technical Blueprint

## Статус

- Статус: cutover completed / rollback window open
- Дата фиксации: 2026-04-25
- Основание: read-path, auth/session/role checks, write-path и comment likes переведены на Appwrite runtime

## Подтвержденное окружение Appwrite

- API Endpoint хранится только в локальном `.env`: `NEXT_PUBLIC_APPWRITE_ENDPOINT` / `APPWRITE_ENDPOINT`
- Project ID хранится только в локальном `.env`: `NEXT_PUBLIC_APPWRITE_PROJECT_ID` / `APPWRITE_PROJECT_ID`
- Недостающий секрет для серверного cutover: `APPWRITE_API_KEY`

## Цель

Перевести Digital AI News с текущего Supabase backend на Appwrite без потери:

- пользователей и ролей;
- публикаций и связанного контента;
- безопасного auth redirect flow;
- административных сценариев.

## Архитектурный принцип миграции

Миграция идет не через one-shot cutover, а через поэтапную замену слоев:

1. документация и целевая схема;
2. provider-agnostic service layer;
3. read-path;
4. profile/role model;
5. auth-flow;
6. write-path;
7. cutover;
8. удаление Supabase legacy.

## Целевая модель Appwrite

### Auth

- Канонический identity provider: `Appwrite Auth`.
- Канонический идентификатор пользователя: `account.$id`.
- SSR-модель: сервер создает и валидирует Appwrite session по cookie.
- Роли не хранятся только в preferences пользователя; источник прав должен оставаться серверным.

### Data

Текущий проект использует реляционную модель Postgres. Для Appwrite целевой моделью на первой итерации становится Appwrite TablesDB с явными reference-полями и серверной агрегацией.

Текущие таблицы/коллекции runtime:

1. `profiles`
2. `posts`
3. `tags`
4. `post_tags`
5. `comments`
6. `likes`
7. `comment_likes`
8. `views`

### Profiles

Минимальные поля:

- `userId` - Appwrite user/account id
- `legacySupabaseUserId` - nullable, для cutover и трассировки
- `email`
- `username`
- `role`
- `bio`
- `location`
- `website`
- `social`
- `avatarUrl`
- `preferredCategory`
- `preferredViewMode`
- `themePreference`
- `createdAt`
- `updatedAt`

Индексы:

- `userId` unique
- `legacySupabaseUserId` unique sparse
- `email` unique
- `username` unique
- `role`

### Posts

Минимальные поля:

- `title`
- `content`
- `category`
- `authorId`
- `authorUsernameSnapshot`
- `archived`
- `pinned`
- `sourceUrl`
- `createdAt`
- `updatedAt`

Индексы:

- `authorId`
- `category`
- `archived`
- `pinned`
- `createdAt`

### Tags

Минимальные поля:

- `name`
- `normalizedName`

Индексы:

- `normalizedName` unique

### Post Tags

Связующая сущность сохраняется отдельно, чтобы не потерять текущую модель many-to-many и упростить миграцию без сложного переписывания UI.

Минимальные поля:

- `postId`
- `tagId`

Индексы:

- compound unique: `postId + tagId`
- `postId`
- `tagId`

### Comments

Минимальные поля:

- `postId`
- `authorId`
- `content`
- `parentId`
- `createdAt`
- `updatedAt`

Индексы:

- `postId`
- `authorId`
- `parentId`
- `createdAt`

### Likes

Минимальные поля:

- `postId`
- `userId`
- `createdAt`

Индексы:

- compound unique: `postId + userId`
- `postId`
- `userId`

### Views

Минимальные поля:

- `postId`
- `userId`
- `createdAt`

Индексы:

- compound unique: `postId + userId`
- `postId`
- `userId`

### Comment Likes

Минимальные поля:

- `commentId`
- `userId`
- `createdAt`

Индексы:

- compound unique: `commentId + userId`
- `commentId`
- `userId`

## Модель ролей

- Роль хранится в `profiles.role`.
- Канонические значения: `student`, `teacher`, `admin`.
- Все чувствительные проверки прав остаются server-side.
- Middleware и server guards должны читать роль через внутренний auth/profile service, а не напрямую из клиента SDK.

## Mapping идентификаторов

Для безопасного cutover обязателен служебный mapping:

| Поле | Назначение |
|---|---|
| `legacySupabaseUserId` | связь старого пользователя Supabase с новым Appwrite identity |
| `userId` | текущий Appwrite identity |
| `email` | безопасный relink и дедупликация |
| `username` | восстановление профиля и UX |
| `role` | перенос прав доступа |

## Permissions strategy

- Публичное чтение контента на первом этапе выполняется через server-side service layer.
- Прямые client-side разрешения Appwrite не должны становиться единственной защитой.
- Запись, удаление, изменение ролей и административные операции выполняются только через серверные маршруты/сервисы.

## Auth cutover strategy

Рекомендуемая стратегия для проекта:

1. Подготовить `profiles` и mapping в Appwrite.
2. Поднять provider-agnostic auth service.
3. Реализовать Appwrite session SSR flow.
4. Для пользователей использовать controlled relink по email при первом входе.

Причина выбора:

- текущий проект уже пережил сложную очистку legacy auth/profile данных;
- relink по email уменьшает риск неконсистентного массового импорта identity;
- серверный контроль упрощает rollback window.

## Provider-agnostic service layer

UI и маршруты должны зависеть только от внутренних сервисов:

- `lib/services/auth.ts`
- `lib/services/posts.ts`
- `lib/services/comments.ts`
- `lib/services/admin.ts`

На phase 1 они еще делегируют в Supabase-реализации, но контракт уже становится независимым от провайдера. Это сохраняет работоспособность приложения на Supabase до отдельного Appwrite cutover.

## Runtime safety

- Runtime по умолчанию использует Appwrite через внутренние сервисы проекта.
- Быстрый rollback поддерживается явным `NEXT_PUBLIC_BACKEND_PROVIDER=supabase`.
- Supabase fallback и migration helpers пока сохраняются в репозитории как rollback window, но не считаются основным runtime-путем.

## Env contract

Минимальные переменные для Appwrite-ветки:

- `NEXT_PUBLIC_BACKEND_PROVIDER=appwrite`
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`

Опционально:

- `APPWRITE_PROFILES_TABLE_ID`
- `APPWRITE_POSTS_TABLE_ID`
- `APPWRITE_TAGS_TABLE_ID`
- `APPWRITE_POST_TAGS_TABLE_ID`
- `APPWRITE_COMMENTS_TABLE_ID`
- `APPWRITE_LIKES_TABLE_ID`
- `APPWRITE_COMMENT_LIKES_TABLE_ID`
- `APPWRITE_VIEWS_TABLE_ID`

## Риски

1. Текущий `post_auth_redirect` flow завязан на Supabase session lifecycle.
2. `profiles.id` сейчас совпадает с Supabase user id, а в Appwrite это изменится.
3. `post_tags`, `likes`, `views` и древовидные comments требуют аккуратного server-side orchestration.
4. Для полного серверного SSR-перехода еще нужен `APPWRITE_API_KEY`.

## Definition of done для Cutover

- Runtime по умолчанию работает на Appwrite.
- Read-path, auth/session/role checks и write-path работают через Appwrite.
- Comment likes поддерживаются в Appwrite schema и runtime.
- `memory_bank` и `docs/README.md` синхронизированы с фактическим состоянием проекта.
- Supabase fallback сохранен как rollback strategy, но не как основной production runtime.
