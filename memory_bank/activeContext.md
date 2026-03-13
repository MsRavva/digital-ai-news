# Active Context

## Текущий фокус

- Система Memory Bank инициализирована в репозитории согласно `AGENTS.md`.
- Redirect flow стабилизирован для password login, регистрации, OAuth callback и server-side guard.
- Закрыты остаточные риски: очистка stale `post_auth_redirect` cookie при ошибке OAuth и server-side сохранение маршрута возврата через `requireAuth(...)`.
- CSP обновлен для встроенного шрифта `react-markdown-editor-lite`.
- Реализован диагностический OAuth flow на `/login`: клиентский контроль provider URL, возврат callback обратно на `/login` и ручная ссылка на GitHub/Google при заблокированном переходе.
- Исправлен блок с логотипами на главной: четвертая иконка GitHub переведена с внешнего URL на локальный SVG.

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
- `components/hero-section.tsx`
- `app/register/page.tsx`
- `lib/auth-server.ts`
- `components/auth-oauth-debug-panel.tsx`
- `lib/oauth-debug.ts`
- `lib/post-auth-redirect.ts`
- `lib/auth-helpers.ts`
- `lib/post-auth-redirect.test.ts`
- `next.config.mjs`
- `package.json`
- `public/github-icon.svg`
- `docs/README.md`
- `memory_bank/*`

## Ближайшие шаги

- Проверить реальное поведение GitHub OAuth на ученических устройствах и понять, запускается ли автоматический переход или нужен ручной fallback.
