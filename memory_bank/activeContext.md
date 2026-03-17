# Active Context

## Текущий фокус

- Система Memory Bank инициализирована в репозитории согласно `AGENTS.md`.
- Redirect flow стабилизирован для password login, регистрации, OAuth callback и server-side guard.
- Закрыты остаточные риски: очистка stale `post_auth_redirect` cookie при ошибке OAuth и server-side сохранение маршрута возврата через `requireAuth(...)`.
- CSP обновлен для встроенного шрифта `react-markdown-editor-lite`.
- Реализован диагностический OAuth flow на `/login`: клиентский контроль provider URL, возврат callback обратно на `/login` и ручная ссылка на GitHub/Google при заблокированном переходе.
- Исправлен блок с логотипами на главной: четвертая иконка GitHub переведена с внешнего URL на локальный SVG.
- В работу взята детальная диагностика редкого сбоя GitHub OAuth после успешного callback: проверяем ветку `exchangeCodeForSession -> profiles select/create/update -> client profile load` и упрощаем ее при необходимости.
- В работу взят следующий этап: вместо экранной диагностики хранить все OAuth-сессии в Supabase и вывести их на отдельную страницу для ролей `teacher`/`admin`.
- По реальным логам подтвержден новый корень проблемы: неуспешные GitHub OAuth сессии падают еще до `code exchange` с сообщением Supabase `Database error saving new user`, вероятный источник — trigger `handle_new_user()` при вставке в `profiles`.
- SQL-фикс trigger `handle_new_user()` уже применен в Supabase как миграция `fix_handle_new_user_unique_username`; новые OAuth signup flow должны переживать коллизии `username`.

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
- `components/user-nav.tsx`
- `lib/oauth-debug.ts`
- `lib/oauth-profile.ts`
- `lib/oauth-audit.ts`
- `lib/oauth-audit-client.ts`
- `lib/post-auth-redirect.ts`
- `lib/auth-helpers.ts`
- `lib/supabase-auth.ts`
- `lib/post-auth-redirect.test.ts`
- `next.config.mjs`
- `package.json`
- `types/database.ts`
- `app/api/oauth-audit/route.ts`
- `app/profile/oauth-audit/page.tsx`
- `app/register/page.tsx`
- `supabase/03_create_oauth_audit_logs.sql`
- `supabase/01_create_trigger.sql`
- `supabase/04_fix_handle_new_user_unique_username.sql`
- `memory_bank/ui_extension/pages/auth-pages.md`
- `memory_bank/ui_extension/pages/oauth-audit.md`
- `public/github-icon.svg`
- `docs/README.md`
- `memory_bank/*`

## Ближайшие шаги

- Прогнать новую серию GitHub OAuth тестов и проверить, ушли ли ошибки `Database error saving new user` из `oauth_audit_logs`.
- Если останутся новые неуспешные flow, разбирать уже следующий по частоте паттерн на основе свежих логов.
