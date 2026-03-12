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
- Защищенные маршруты без сессии перенаправляются на `/login`.
- Целевой путь после логина сохраняется в `httpOnly` cookie `post_auth_redirect`.
- Завершение post-auth редиректа централизовано в `app/auth/post-login/route.ts`.
- OAuth callback в `app/auth/callback/route.ts` завершает обмен кода на сессию, при необходимости создает профиль и отдает управление в общий post-login flow.
- Клиентские страницы `login/register` больше не хранят redirect в `sessionStorage`, а используют серверный post-login endpoint.

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

- Аутентификация и сессии обслуживаются Supabase Auth.
- Профили и публикации читаются через Supabase client/server helpers.
- Роли `student`, `teacher`, `admin` влияют на доступ к административным и редакторским сценариям.

## Связанные документы

- `docs/PRD.md` - продуктовый контекст и ожидания.
- `docs/QUICK_START_SUPABASE_AUTH.md` - вводный auth setup.
- `memory_bank/systemPatterns.md` - технические паттерны и связи подсистем.
