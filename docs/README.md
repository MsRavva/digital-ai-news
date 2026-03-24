# Архитектура Digital AI News

## Назначение

Digital AI News - внутренняя новостная платформа на Next.js 16 и Supabase для публикации, чтения и администрирования материалов по AI.

## Основные подсистемы

- `app/` - маршруты App Router, страницы, layouts и route handlers.
- `components/` - UI-компоненты, формы публикаций, шапка, навигация, таблицы и сетки.
- `context/` - клиентский auth context и реакция на смену сессии.
- `lib/` - интеграция с Supabase, auth helpers, redirect flow, rate limiting и прикладные утилиты.
- `supabase/` - SQL, миграции и сопутствующая конфигурация Supabase.
- `docs/` - продуктовая и техническая документация.
- `memory_bank/` - операционная память проекта для текущего состояния, решений и прогресса.

## Аутентификация и редиректы

- Проверка доступа выполняется в `middleware.ts`.
- Server Components могут использовать `lib/auth-server.ts` для редиректа на `/login` с сохранением безопасного пути возврата.
- Защищенные маршруты без сессии перенаправляются на `/login`.
- Целевой путь после логина сохраняется в `httpOnly` cookie `post_auth_redirect`.
- Завершение post-auth редиректа централизовано в `app/auth/post-login/route.ts`.
- OAuth callback в `app/auth/callback/route.ts` завершает обмен кода на сессию, при необходимости создает профиль, очищает устаревший redirect-cookie при ошибках и отдает управление в общий post-login flow.
- Защитная логика профиля после OAuth теперь идет по линейной схеме `select profile -> upsert по id -> confirm profile`, без временных `insert/delete` операций для проверки username.
- Supabase trigger `handle_new_user()` должен безопасно создавать профиль даже при коллизиях `username`; для этого функция в SQL переведена на retry-механику с генерацией суффикса.
- Повторная диагностика показала, что для legacy-данных этого недостаточно: часть GitHub OAuth-попыток упирается в `unique_email` на `public.profiles`, потому что в проекте существуют исторические профили с email, но без соответствующих записей в `auth.users`.
- Для таких legacy-профилей Supabase automatic identity linking не срабатывает, так как он линкует OAuth identity только к существующему пользователю в `auth.users` с тем же подтвержденным email.
- Для teacher/admin в `/profile/oauth-audit` добавлен отдельный блок backfill orphan-профилей: серверный API создает недостающий `auth.users` через Admin API, а SQL-функция `reassign_profile_id(...)` перепривязывает legacy `profiles.id` и связанные ссылки на новый UUID из Auth.
- Автоматический backfill сознательно исключает профили, у которых уже есть публикации в `posts`, чтобы не затронуть авторство контента без отдельной ручной миграции.
- Клиентские страницы `login/register` больше не хранят redirect в `sessionStorage`, а используют серверный post-login endpoint.
- Каждая OAuth-сессия теперь записывается в `oauth_audit_logs` независимо от результата: клиент фиксирует старт flow и попытку перехода, callback дописывает результат обмена кода, работу с `profiles` и финальный статус.
- Отдельная teacher/admin страница `/profile/oauth-audit` показывает последние OAuth-сессии с диагностикой по шагам и итоговым статусом.

## Безопасность платформы

- CSP задается в `next.config.mjs`.
- Для совместимости с `react-markdown-editor-lite` разрешен `font-src 'self' data:` из-за встроенного base64-шрифта редактора.
- Собственный `MarkdownEditor` поддерживает inline-toolbar и загрузку изображений в Supabase Storage bucket `post-images`; в Markdown сохраняются обычные публичные URL, а не base64-данные.

## Ключевые маршруты

- `/` - главная страница с публикациями.
- `/archive` - архив материалов.
- `/create` - создание публикации.
- `/edit/[id]` - редактирование публикации.
- `/posts/[id]` - просмотр отдельной публикации.
- `/profile` - профиль пользователя.
- `/profile/oauth-audit` - просмотр журнала OAuth-сессий для `teacher` и `admin`.
- `/api/admin/orphan-profiles/backfill` - teacher/admin endpoint для пакетного восстановления legacy orphan-профилей.
- `/api/uploads/post-image` - защищенный endpoint загрузки изображений постов в Supabase Storage.
- `/admin` и вложенные admin-маршруты - управление доступом и ролями.
- `/login`, `/register`, `/forgot-password`, `/reset-password` - auth flow.
- `/auth/callback` - OAuth callback.
- `/auth/post-login` - единая серверная точка финального редиректа после авторизации.
- `/api/oauth-audit` - серверная запись клиентских шагов OAuth в audit log.

## Данные и роли

- Аутентификация и сессии обслуживаются Supabase Auth.
- Профили, OAuth audit logs и публикации читаются через Supabase client/server helpers.
- В текущих данных есть legacy-рассинхронизация между `public.profiles` и `auth.users`; для окончательного исправления OAuth нужен отдельный backfill Auth-пользователей для orphan-профилей.
- Роли `student`, `teacher`, `admin` влияют на доступ к административным и редакторским сценариям.

## Связанные документы

- `docs/PRD.md` - продуктовый контекст и ожидания.
- `docs/QUICK_START_SUPABASE_AUTH.md` - вводный auth setup.
- `memory_bank/systemPatterns.md` - технические паттерны и связи подсистем.
