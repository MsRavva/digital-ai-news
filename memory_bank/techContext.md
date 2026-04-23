# Tech Context

## Стек

- Runtime и пакетный менеджер: `bun`
- Framework: Next.js 16 App Router
- UI: React 19, Tailwind CSS 4, shadcn/ui
- Backend/Auth/Data: Supabase
- Язык: TypeScript
- Проверки: Biome, TypeScript (`bunx tsc --noEmit`)

## Ограничения

- Не запускать и не останавливать dev server: им управляет пользователь.
- Следовать `AGENTS.md`, поддерживать `memory_bank` в актуальном состоянии.
- `docs/README.md` считается главным высокоуровневым описанием архитектуры.

## Технические детали auth flow

- Middleware использует `@supabase/ssr` и серверные cookies.
- Безопасность redirect построена на проверке относительных путей.
- Клиентские страницы auth больше не зависят от `sessionStorage` для возврата после логина.
- Server-side guard `lib/auth-server.ts` использует тот же redirect helper, что и middleware.
- Технический маршрут `/auth/post-login` должен оставаться публичным.
- `lib/supabase-auth.ts` теперь умеет возвращать provider URL через `skipBrowserRedirect: true`, после чего клиент сам инициирует навигацию.
- Подтверждение профиля после OAuth вынесено в серверный helper `lib/oauth-profile.ts`; клиентский `AuthProvider` использует retry helper для дозагрузки профиля после появления сессии.
- Для текущей схемы Supabase критичен SQL trigger `public.handle_new_user()`; после анализа реальных логов он усилен retry-механикой против duplicate `username`.

## Проверки в текущей сессии

- `bunx tsc --noEmit` - успешно.
- `bun install` - успешно, локальные зависимости и типы восстановлены.
- `bun test` - успешно.
- `bun run check` - неуспешно из-за существующих форматных проблем в репозитории, не связанных только с текущими файлами.
