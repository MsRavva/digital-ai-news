# Архитектура Digital AI News

## Назначение

Digital AI News - внутренняя новостная платформа на Next.js 16 для публикации, чтения и администрирования материалов по AI. Текущая production-реализация работает на Supabase, а проектный backend scope подтвержденно мигрирует на Appwrite.

## Основные подсистемы

- `app/` - маршруты App Router, страницы, layouts и route handlers.
- `components/` - UI-компоненты, формы публикаций, шапка, навигация, таблицы и сетки.
- `context/` - клиентский auth context и реакция на смену сессии.
- `lib/` - интеграции backend-провайдера, auth helpers, redirect flow, rate limiting и прикладные утилиты.
- `supabase/` - текущий SQL-слой и legacy-конфигурация Supabase до полного cutover.
- `docs/APPWRITE_TECHNICAL_BLUEPRINT.md` - утвержденная целевая схема миграции на Appwrite TablesDB.
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
- Клиентские страницы `login/register` больше не хранят redirect в `sessionStorage`, а используют серверный post-login endpoint.
- Временный диагностический слой вокруг OAuth удален после стабилизации авторизации; в проекте оставлена только боевая логика входа и безопасного редиректа.
- Для миграции на Appwrite вводится provider-agnostic service layer, чтобы auth и data flow можно было переключать без массового переписывания UI.
- По умолчанию приложение продолжает работать на Supabase: `NEXT_PUBLIC_BACKEND_PROVIDER` не должен быть установлен в `appwrite` до завершения read/auth cutover.

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

- Текущий runtime auth и data layer обслуживаются Supabase.
- Целевая backend-модель для проекта - Appwrite Auth + Appwrite TablesDB.
- Переход выполняется поэтапно через внутренние сервисы проекта, а не через прямой one-shot cutover.
- Appwrite TablesDB schema уже создана служебным скриптом `scripts/setup-appwrite-schema.ts`; runtime-данные приложения остаются в Supabase до отдельного переключения.
- Legacy-рассинхронизация между `public.profiles` и `auth.users` была закрыта через backfill и перепривязку профилей к `auth.users.id`, чтобы начать миграцию на Appwrite с консистентной пользовательской базой.
- Роли `student`, `teacher`, `admin` влияют на доступ к административным и редакторским сценариям и должны оставаться server-managed после миграции.

## Связанные документы

- `docs/PRD.md` - продуктовый контекст и ожидания.
- `docs/QUICK_START_SUPABASE_AUTH.md` - вводный auth setup.
- `docs/APPWRITE_TECHNICAL_BLUEPRINT.md` - целевая Appwrite TablesDB-схема, env contract и порядок cutover.
- `memory_bank/systemPatterns.md` - технические паттерны и связи подсистем.
