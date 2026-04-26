# Архитектура Digital AI News

## Назначение

Digital AI News - внутренняя новостная платформа на Next.js 16 для публикации, чтения и администрирования материалов по AI. Текущий runtime backend переведен на Appwrite с сохранением безопасного server-driven auth flow и миграционным forced relink legacy-профилей по email.

## Основные подсистемы

- `app/` - маршруты App Router, страницы, layouts и route handlers.
- `components/` - UI-компоненты, формы публикаций, шапка, навигация, таблицы и сетки.
- `context/` - клиентский auth context и реакция на смену сессии.
- `lib/` - интеграции backend-провайдера, auth helpers, redirect flow, rate limiting и прикладные утилиты.
- `supabase/` - legacy SQL-слой и миграционные артефакты, сохраненные для rollback window и истории проекта.
- `docs/APPWRITE_TECHNICAL_BLUEPRINT.md` - утвержденная целевая схема миграции на Appwrite TablesDB.
- `docs/` - продуктовая и техническая документация.
- `memory_bank/` - операционная память проекта для текущего состояния, решений и прогресса.

## Аутентификация и редиректы

- Проверка доступа выполняется в `middleware.ts`.
- Server Components могут использовать `lib/auth-server.ts` для редиректа на `/login` с сохранением безопасного пути возврата.
- Защищенные маршруты без сессии перенаправляются на `/login`.
- Целевой путь после логина сохраняется в `httpOnly` cookie `post_auth_redirect`.
- Завершение post-auth редиректа централизовано в `app/auth/post-login/route.ts`.
- Appwrite auth использует SSR-подход: email/password и OAuth создают `httpOnly` cookie `a_session_<projectId>` через внутренние route handlers.
- OAuth callback в `app/auth/callback/route.ts` для Appwrite завершает обмен `userId + secret` на session, пишет cookie и отдает управление в общий post-login flow.
- Для legacy-пользователей включен forced relink по email: при первом Appwrite login/register/OAuth профиль в Appwrite `profiles` upsert'ится на основе исторического Supabase `profiles` с переносом `legacySupabaseUserId`, `username` и `role`.
- Клиентские страницы `login/register` больше не хранят redirect в `sessionStorage`, а используют серверный post-login endpoint.
- Временный диагностический слой вокруг OAuth удален; в проекте оставлена только боевая логика входа и безопасного редиректа.
- Provider-agnostic service layer сохранен, но runtime по умолчанию теперь Appwrite. Для rollback можно явно установить `NEXT_PUBLIC_BACKEND_PROVIDER=supabase`.

## Безопасность платформы

- CSP задается в `next.config.mjs`.
- Для совместимости с `react-markdown-editor-lite` разрешен `font-src 'self' data:` из-за встроенного base64-шрифта редактора.
- Собственный `MarkdownEditor` поддерживает inline-toolbar и обычный Markdown для изображений по внешним URL.

## Ключевые маршруты

- `/` - главная страница с публикациями.
- `/archive` - архив материалов.
- `/create` - создание публикации.
- `/edit/[id]` - редактирование публикации.
- `/posts/[id]` - просмотр отдельной публикации.
- `/profile` - профиль пользователя.
- `/admin` и вложенные admin-маршруты - управление доступом и ролями.
- `/login`, `/register`, `/forgot-password`, `/reset-password` - auth flow.
- `/auth/callback` - OAuth callback.
- `/auth/post-login` - единая серверная точка финального редиректа после авторизации.

## Данные и роли

- Текущий runtime auth и data layer обслуживаются Appwrite Auth + Appwrite TablesDB.
- Переход выполнен поэтапно через внутренние сервисы проекта, без one-shot переписывания UI.
- Appwrite TablesDB schema создается и синхронизируется служебным скриптом `scripts/setup-appwrite-schema.ts`.
- Физическая миграция legacy-данных из Supabase в Appwrite выполнена идемпотентным скриптом `scripts/migrate-supabase-to-appwrite.ts`; скрипт поддерживает `--dry-run` и `--apply`, нормализует email/username/tag references и сохраняет ссылочную целостность.
- Legacy-рассинхронизация между `public.profiles` и `auth.users` была закрыта заранее, а в текущем cutover используется forced relink по email для безопасной привязки исторических профилей к новым Appwrite account IDs.
- Роли `student`, `teacher`, `admin` влияют на доступ к административным и редакторским сценариям и должны оставаться server-managed после миграции.

## Связанные документы

- `docs/PRD.md` - продуктовый контекст и ожидания.
- `docs/QUICK_START_SUPABASE_AUTH.md` - вводный auth setup.
- `docs/APPWRITE_TECHNICAL_BLUEPRINT.md` - целевая Appwrite TablesDB-схема, env contract и порядок cutover.
- `memory_bank/systemPatterns.md` - технические паттерны и связи подсистем.
