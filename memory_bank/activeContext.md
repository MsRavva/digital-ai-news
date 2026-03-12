# Active Context

## Текущий фокус

- Система Memory Bank инициализирована в репозитории согласно `AGENTS.md`.
- Выполнен рефакторинг redirect flow: единый серверный post-login endpoint и cookie-based хранение post-auth redirect.
- Удалены лишние `console.log` из auth redirect flow.
- Добавлены unit-тесты для redirect helper и исправлена проверка auth routes с query string.

## Активные решения

- Использовать `httpOnly` cookie `post_auth_redirect` как единый источник истины для возврата после авторизации.
- Финализировать редирект через `app/auth/post-login/route.ts`.
- Поддерживать `docs/README.md` как источник архитектурной правды верхнего уровня.

## Затронутые файлы

- `middleware.ts`
- `app/auth/callback/route.ts`
- `app/auth/post-login/route.ts`
- `app/login/page.tsx`
- `app/register/page.tsx`
- `lib/post-auth-redirect.ts`
- `lib/auth-helpers.ts`
- `lib/post-auth-redirect.test.ts`
- `package.json`
- `docs/README.md`
- `memory_bank/*`

## Ближайшие шаги

- Проверить рабочее дерево и при необходимости зафиксировать изменения в git.
- При желании расширить тесты до route-level или e2e сценариев для middleware и OAuth callback.
