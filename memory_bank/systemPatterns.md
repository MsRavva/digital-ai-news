# System Patterns

## Общая архитектура

- Frontend и route handlers реализованы через Next.js App Router.
- Auth state на клиенте держится в `context/auth-context.tsx`.
- Middleware выполняет серверную авторизационную проверку до рендера защищенных маршрутов.
- Доступ к данным и auth API инкапсулирован в `lib/supabase-*.ts`.

## Паттерн post-auth redirect

- `middleware.ts` определяет защищенный маршрут и отсутствие сессии.
- Целевой относительный путь собирается из `pathname + search`.
- Значение валидируется и сохраняется в `post_auth_redirect` cookie.
- Пользователь перенаправляется на `/login?redirect=...`.
- Для server-side guard используется `lib/auth-server.ts`, который формирует такой же безопасный redirect на `/login`.
- После успешного входа и при OAuth callback переход выполняется через `/auth/post-login`.
- `app/auth/post-login/route.ts` считывает cookie или query param, повторно валидирует путь, редиректит и очищает cookie.

## Паттерн OAuth callback

- `app/auth/callback/route.ts` обменивает код на сессию Supabase.
- После успешного code exchange callback линейно подтверждает профиль в `profiles`: сначала читает запись по `id`, затем при необходимости делает `upsert` по `id` и повторно подтверждает наличие профиля несколькими короткими проверками.
- Временная схема с пробным `insert/delete` для проверки свободного username больше не используется, чтобы уменьшить вероятность race-condition и лишних запросов к базе.
- Если callback приходит без `code` и с `Database error saving new user`, это трактуется как вероятный сбой внутри Supabase Auth trigger `handle_new_user()` или вставки в `profiles`, а не как ошибка `exchangeCodeForSession`.
- При ошибке callback очищает `post_auth_redirect`, чтобы не использовать устаревший маршрут в следующем логине.
- Callback не вычисляет redirect через `referer`; используется общий post-login flow.

## Паттерн SQL trigger профиля

- `public.handle_new_user()` остается первой линией создания профиля для новых пользователей Supabase Auth.
- Функция должна быть идемпотентной по `id` и устойчивой к коллизиям `username`: при конфликте username она повторяет вставку с суффиксом вместо падения всего OAuth signup flow.
- `context/auth-context.tsx` загружает профиль через общий retry-pattern, чтобы короткая задержка между сессией и доступностью профиля не ломала клиентское состояние после OAuth.

## Паттерны ролей и доступа

- Middleware ограничивает гостевые и защищенные маршруты.
- Admin-маршруты дополнительно проверяют роль профиля.
- Роли профиля читаются из таблицы `profiles`.

## Паттерн CSP

- Заголовок `Content-Security-Policy` задается в `next.config.mjs`.
- Для редактора markdown разрешен `font-src 'self' data:` без расширения других источников.
