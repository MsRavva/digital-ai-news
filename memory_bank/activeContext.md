# Active Context

## Текущий фокус

- Система Memory Bank инициализирована в репозитории согласно `AGENTS.md`.
- Redirect flow стабилизирован для password login, регистрации, OAuth callback и server-side guard.
- Закрыты остаточные риски: очистка stale `post_auth_redirect` cookie при ошибке OAuth и server-side сохранение маршрута возврата через `requireAuth(...)`.
- CSP обновлен для встроенного шрифта `react-markdown-editor-lite`.

## Активные решения

- Использовать `httpOnly` cookie `post_auth_redirect` как единый источник истины для возврата после авторизации.
- Финализировать редирект через `app/auth/post-login/route.ts`.
- Использовать `lib/auth-server.ts` как серверный guard с той же схемой redirect, что и в `middleware.ts`.
- Поддерживать `docs/README.md` как источник архитектурной правды верхнего уровня.

## Затронутые файлы

- `middleware.ts`
- `app/auth/callback/route.ts`
- `app/auth/post-login/route.ts`
- `app/admin/teachers/layout.tsx`
- `app/login/page.tsx`
- `app/register/page.tsx`
- `lib/auth-server.ts`
- `lib/post-auth-redirect.ts`
- `lib/auth-helpers.ts`
- `lib/post-auth-redirect.test.ts`
- `next.config.mjs`
- `package.json`
- `docs/README.md`
- `memory_bank/*`

## Ближайшие шаги

- Поддерживать `memory_bank` и `docs/README.md` синхронизированными с auth-flow.
- При необходимости добавить route-level или e2e проверки для `middleware`, `/auth/callback` и `/auth/post-login`.
