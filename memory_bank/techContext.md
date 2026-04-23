# Tech Context

## Стек

- Runtime и пакетный менеджер: `bun`
- Framework: Next.js 16 App Router
- UI: React 19, Tailwind CSS 4, shadcn/ui
- Текущий Backend/Auth/Data: Supabase
- Целевой Backend/Auth/Data: Appwrite
- Язык: TypeScript
- Проверки: Biome, TypeScript (`bunx tsc --noEmit`)

## Ограничения

- Не запускать и не останавливать dev server: им управляет пользователь.
- Следовать `AGENTS.md`, поддерживать `memory_bank` в актуальном состоянии.
- `docs/README.md` считается главным высокоуровневым описанием архитектуры.
- Legacy-настройки внешних agent/editor/CI-интеграций `.claude`, `.cursor`, `.github`, `.kiro`, `.vscode` удалены по подтверждению пользователя и не считаются активной инфраструктурой проекта.

## Технические детали auth flow

- Middleware использует `@supabase/ssr` и серверные cookies.
- Безопасность redirect построена на проверке относительных путей.
- Клиентские страницы auth больше не зависят от `sessionStorage` для возврата после логина.
- Server-side guard `lib/auth-server.ts` использует тот же redirect helper, что и middleware.
- Технический маршрут `/auth/post-login` должен оставаться публичным.
- `lib/supabase-auth.ts` теперь умеет возвращать provider URL через `skipBrowserRedirect: true`, после чего клиент сам инициирует навигацию.
- Подтверждение профиля после OAuth вынесено в серверный helper `lib/oauth-profile.ts`; клиентский `AuthProvider` использует retry helper для дозагрузки профиля после появления сессии.
- Для текущей схемы Supabase критичен SQL trigger `public.handle_new_user()`; после анализа реальных логов он усилен retry-механикой против duplicate `username`.

## Технические детали Appwrite migration

- Appwrite API Endpoint хранится только в локальном `.env` (`NEXT_PUBLIC_APPWRITE_ENDPOINT` / `APPWRITE_ENDPOINT`).
- Appwrite Project ID хранится только в локальном `.env` (`NEXT_PUBLIC_APPWRITE_PROJECT_ID` / `APPWRITE_PROJECT_ID`).
- Для полного SSR и серверных административных операций еще нужен `APPWRITE_API_KEY`.
- На phase 1 в проект добавляется слой `lib/appwrite/*` для конфигурации и будущего SSR/session cutover.
- Новый Appwrite-код должен использовать `TablesDB`, а не legacy `Databases`.
- Создание и повторная синхронизация схемы Appwrite выполняются через `scripts/setup-appwrite-schema.ts`; скрипт idempotent и берет credentials только из локального `.env`.
- Переключение провайдера должно идти через `NEXT_PUBLIC_BACKEND_PROVIDER`, а не через прямую замену импортов по всему UI.

## Проверки в текущей сессии

- `bunx tsc --noEmit` - успешно.
- `bun install` - успешно, локальные зависимости и типы восстановлены.
- `bun test` - успешно.
- `bun run check` - неуспешно из-за существующих форматных проблем в репозитории, не связанных только с текущими файлами.
