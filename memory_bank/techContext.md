# Tech Context

## Стек

- Runtime и пакетный менеджер: `bun`
- Framework: Next.js 16 App Router
- UI: React 19, Tailwind CSS 4, shadcn/ui
- Текущий Backend/Auth/Data: Appwrite
- Rollback Backend/Auth/Data: Supabase
- Язык: TypeScript
- Проверки: Biome, TypeScript (`bunx tsc --noEmit`)

## Ограничения

- Не запускать и не останавливать dev server: им управляет пользователь.
- Следовать `AGENTS.md`, поддерживать `memory_bank` в актуальном состоянии.
- `docs/README.md` считается главным высокоуровневым описанием архитектуры.
- Legacy-настройки внешних agent/editor/CI-интеграций `.claude`, `.cursor`, `.github`, `.kiro`, `.vscode` удалены по подтверждению пользователя и не считаются активной инфраструктурой проекта.

## Технические детали auth flow

- `proxy.ts` использует cookie-based guard для Appwrite-ветки по умолчанию и сохраняет Supabase-ветку как rollback-режим.
- Безопасность redirect построена на проверке относительных путей.
- Клиентские страницы auth больше не зависят от `sessionStorage` для возврата после логина.
- Server-side guard `lib/auth-server.ts` использует тот же redirect helper, что и middleware.
- Технический маршрут `/auth/post-login` должен оставаться публичным.
- `lib/supabase-auth.ts` теперь умеет возвращать provider URL через `skipBrowserRedirect: true`, после чего клиент сам инициирует навигацию.
- Подтверждение профиля после OAuth вынесено в серверный helper `lib/oauth-profile.ts`; клиентский `AuthProvider` использует retry helper для дозагрузки профиля после появления сессии.
- Историческая Supabase auth-логика и SQL trigger `public.handle_new_user()` сохраняются как rollback reference, но не являются основным runtime-путем проекта.

## Технические детали Appwrite migration

- Appwrite API Endpoint хранится только в локальном `.env` (`NEXT_PUBLIC_APPWRITE_ENDPOINT` / `APPWRITE_ENDPOINT`).
- Appwrite Project ID хранится только в локальном `.env` (`NEXT_PUBLIC_APPWRITE_PROJECT_ID` / `APPWRITE_PROJECT_ID`).
- Для текущего Appwrite runtime обязателен `APPWRITE_API_KEY`.
- На phase 1 в проект добавляется слой `lib/appwrite/*` для конфигурации и будущего SSR/session cutover.
- Новый Appwrite-код должен использовать `TablesDB`, а не legacy `Databases`.
- Создание и повторная синхронизация схемы Appwrite выполняются через `scripts/setup-appwrite-schema.ts`; скрипт idempotent и берет credentials только из локального `.env`.
- Провайдер по умолчанию теперь Appwrite; rollback на Supabase возможен только через явное `NEXT_PUBLIC_BACKEND_PROVIDER=supabase`.
- Supabase зависимости и fallback helpers намеренно не удалены из `package.json` и `lib/supabase-*`, чтобы rollback оставался быстрым и не требовал срочного восстановления кода.
- `baseline-browser-mapping` обновлен до `2.10.22`, но Next build все еще показывает предупреждение из-за вложенной старой транзитивной версии в дереве зависимостей; это не блокирует сборку.
- Для текущего этапа `read-path` Appwrite читается сервером через `node-appwrite` и `APPWRITE_API_KEY`; клиент получает данные через Next route handlers `app/api/appwrite/*`.
- Appwrite auth runtime использует SSR-подход из `appwrite-typescript` skill: email/password и OAuth создают cookie `a_session_<projectId>` через серверные endpoints, а текущий пользователь читается через per-request session client.
- Password recovery в Appwrite проходит через `createRecovery`/`updateRecovery`, а OAuth через `createOAuth2Token` + `/auth/callback` + `createSession`.
- Инициализация Appwrite OAuth должна опираться на server config (`APPWRITE_*`) и `request.origin`; нельзя требовать наличие `NEXT_PUBLIC_APPWRITE_*` в server-only init path, иначе возможен ложный `Appwrite config is not available.`.
- Прямой browser-read из Appwrite по-прежнему не используется; клиент получает данные и auth state через внутренние endpoints и service layer.
- Appwrite write-path реализован через `lib/appwrite/write.ts` и route handlers `app/api/appwrite/posts/*`, `app/api/appwrite/comments/*`, `app/api/appwrite/profile`; клиентский UI не пишет в Appwrite SDK напрямую.
- User preferences (`preferredCategory`, `preferredViewMode`, `themePreference`) теперь читаются и пишутся в Appwrite `profiles` через внутренний API при `NEXT_PUBLIC_BACKEND_PROVIDER=appwrite`.

## Проверки в текущей сессии

- `bunx tsc --noEmit` - успешно.
- `bun install` - успешно, локальные зависимости и типы восстановлены.
- `opencode mcp auth supabase` - успешно, MCP server `supabase` подключен.
- `bun test` - успешно.
- `bun run check` - неуспешно из-за существующих форматных проблем в репозитории, не связанных только с текущими файлами.
