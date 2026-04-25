# System Patterns

## Общая архитектура

- Frontend и route handlers реализованы через Next.js App Router.
- Auth state на клиенте держится в `context/auth-context.tsx`.
- Middleware выполняет серверную авторизационную проверку до рендера защищенных маршрутов.
- Доступ к данным и auth API инкапсулирован во внутренних сервисах `lib/services/*` и Appwrite adapters `lib/appwrite/*`.
- На phase 1 миграции вводится provider-agnostic слой `lib/services/*`, который становится единственной точкой входа для UI, pages и route handlers.

## Паттерн post-auth redirect

- `middleware.ts` определяет защищенный маршрут и отсутствие сессии.
- Целевой относительный путь собирается из `pathname + search`.
- Значение валидируется и сохраняется в `post_auth_redirect` cookie.
- Пользователь перенаправляется на `/login?redirect=...`.
- Для server-side guard используется `lib/auth-server.ts`, который формирует такой же безопасный redirect на `/login`.
- После успешного входа и при OAuth callback переход выполняется через `/auth/post-login`.
- `app/auth/post-login/route.ts` считывает cookie или query param, повторно валидирует путь, редиректит и очищает cookie.

## Паттерн OAuth callback

- В Appwrite-ветке `app/auth/callback/route.ts` завершает SSR OAuth через `userId + secret -> createSession`, пишет cookie `a_session_<projectId>` и отдает управление в общий post-login flow.
- После первого Appwrite login/register/OAuth выполняется forced relink профиля по email, чтобы сохранить `legacySupabaseUserId`, `username` и `role` из исторического Supabase `profiles`.
- При ошибке callback очищает `post_auth_redirect`, чтобы не использовать устаревший маршрут в следующем логине.
- Callback не вычисляет redirect через `referer`; используется общий post-login flow.

## Паттерн SQL trigger профиля

- Исторический Supabase trigger/profile logic сохраняется только как legacy knowledge и rollback reference.
- `context/auth-context.tsx` загружает профиль через внутренний provider-agnostic auth service; для Appwrite состояние берется из `/api/auth/appwrite/me`.

## Паттерны ролей и доступа

- Middleware ограничивает гостевые и защищенные маршруты.
- Admin-маршруты дополнительно проверяют роль профиля.
- Роли профиля читаются из таблицы `profiles`.
- В Appwrite-ветке middleware проверяет наличие cookie `a_session_<projectId>`, а server-side role check выполняется в `lib/auth-server.ts` и `lib/appwrite/route-guards.ts` через профиль из Appwrite `profiles`.

## Паттерн миграции на Appwrite

- Текущий runtime по умолчанию — Appwrite, но fallback на Supabase сохраняется через `lib/services/*` и `NEXT_PUBLIC_BACKEND_PROVIDER=supabase`.
- Новые точки интеграции строятся через `lib/services/*`, чтобы не привязывать UI к `lib/supabase-*`.
- Appwrite рассматривается как целевой backend provider для auth и data.
- UI по-прежнему не обращается к Appwrite SDK напрямую: `lib/services/*` дергает внутренние route handlers, а те работают с `TablesDB`/`Account` через `node-appwrite`.
- Mapping `legacySupabaseUserId -> Appwrite userId` считается обязательной частью целевой модели.

## Паттерн service layer

- `lib/services/auth.ts` инкапсулирует sign-in, sign-up, OAuth, session, profile updates и password recovery.
- `lib/services/posts.ts` инкапсулирует чтение и запись публикаций, статистику и post actions.
- `lib/services/comments.ts` инкапсулирует дерево комментариев и comment likes.
- `lib/services/admin.ts` инкапсулирует административные выборки пользователей и ролей.
- Внутри Appwrite read-ветки сервисы вызывают внутренние API endpoints (`/api/appwrite/posts`, `/api/appwrite/posts/[id]`, `/api/appwrite/posts/[id]/comments`, `/api/appwrite/admin/teachers`), чтобы сохранить клиентский контракт и не требовать Appwrite browser-session.
- Внутри Appwrite auth-ветки `lib/services/auth.ts` вызывает внутренние endpoints `/api/auth/appwrite/*`, которые создают/читают/удаляют server-managed Appwrite session cookie.
- Для legacy-пользователей применяется forced relink по email: при первом Appwrite login/register/OAuth профиль в Appwrite upsert'ится из Supabase `profiles` с сохранением `legacySupabaseUserId`.
- Внутри Appwrite write-ветки `lib/services/posts.ts`, `lib/services/comments.ts`, `lib/services/auth.ts` и preference helpers вызывают внутренние endpoints `app/api/appwrite/*`, а фактическая запись идет через `node-appwrite` и `TablesDB`.
- Appwrite schema покрывает `posts`, `tags`, `post_tags`, `comments`, `likes`, `comment_likes`, `views`, `profiles`.

## Паттерн CSP

- Заголовок `Content-Security-Policy` задается в `next.config.mjs`.
- Для редактора markdown разрешен `font-src 'self' data:` без расширения других источников.
