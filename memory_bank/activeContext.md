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
- Выявлена системная причина остаточного OAuth-сбоя: в `public.profiles` есть исторические orphan-профили с email, но без соответствующих записей в `auth.users`; следующий этап — безопасная миграция этих аккаунтов без потери связанного контента.
- Повторная проверка после применения trigger-фикса показала, что проблема не устранена: свежие auth logs снова дают `Database error saving new user`, причем в логах встречаются и `unique_email`, и маскирующий `handle_new_user failed to create unique profile username`.
- Собрана карта связей `profiles.id`: реальные внешние ключи идут из `posts.author_id`, `comments.author_id`, `likes.user_id`, `views.user_id`, `comment_likes.user_id`.
- Подтверждено текущее состояние данных: `150` профилей с email, `48` записей в `auth.users` с email, `104` orphan-профиля без соответствующего `auth.users`, при этом только `2` orphan-профиля участвуют в контентных связях через `posts`.
- По официальной документации Supabase automatic identity linking работает только для существующего `auth.users` с подтвержденным email; одна строка в `public.profiles` для этого недостаточна.
- Реализован первый рабочий контур backfill orphan-профилей: закрытый teacher/admin API использует `supabase.auth.admin.createUser`, а SQL-функция `reassign_profile_id(...)` создает новую профильную запись под UUID из Auth, переносит ссылки и удаляет legacy-строку.
- Trigger `handle_new_user()` обновлен повторно: retry идет только по `unique_username`, а backfill-флаг читается и из `raw_app_meta_data`, и из `raw_user_meta_data`.
- Боевой тест на профиле `h.nukuta@gmail.com` прошел успешно: создан `auth.users.id = 6aa60f33-bc55-4089-8fad-f883809b70c1`, профиль перепривязан, orphan-профилей стало `103`, auth users с email стало `49`.
- По дополнительному требованию пользователя автоматический backfill теперь жестко исключает всех авторов публикаций (`postsCount > 0`), даже если они остаются orphan.
- Массовый backfill выполнен для всех остальных orphan-профилей без публикаций: успешно восстановлен еще `101` пользователь, итоговое состояние — `150` auth users с email и только `2` orphan-профиля, оба являются авторами публикаций и специально не тронуты.
- По дополнительному решению пользователя вручную восстановлены и два оставшихся orphan-автора публикаций: для `svasya@ro.ru` и `eg20master11@gmail.com` созданы `auth.users`, а `10` и `1` публикация соответственно перепривязаны на новые auth UUID.
- Текущее состояние базы после ручного переноса: `0` orphan-профилей, `150` профилей с email выровнены с `auth.users`; отдельно остаются `2` auth users без профиля, но это уже другая проблема, не связанная с legacy orphan-профилями.

## Активные решения

- Использовать `httpOnly` cookie `post_auth_redirect` как единый источник истины для возврата после авторизации.
- Финализировать редирект через `app/auth/post-login/route.ts`.
- Использовать `lib/auth-server.ts` как серверный guard с той же схемой redirect, что и в `middleware.ts`.
- Поддерживать `docs/README.md` как источник архитектурной правды верхнего уровня.
- Не лечить orphan-проблему ручным апдейтом `profiles.id` или снятием `unique_email`; корректный путь — восстановление отсутствующих `auth.users` через admin create user/backfill, чтобы OAuth мог автоматически линковать identity по email.
- Перед backfill скорректировать `handle_new_user()`, чтобы retry выполнялся только для `unique_username`, а конфликт `unique_email` не маскировался ложной ошибкой про username.

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
- `supabase/05_backfill_auth_users_for_orphan_profiles.sql` (планируется)
- `supabase/05_prepare_legacy_profile_backfill.sql`
- `lib/orphan-auth-backfill.ts`
- `components/oauth-orphan-backfill-card.tsx`
- `app/api/admin/orphan-profiles/backfill/route.ts`
- `memory_bank/ui_extension/pages/auth-pages.md`
- `memory_bank/ui_extension/pages/oauth-audit.md`
- `public/github-icon.svg`
- `docs/README.md`
- `memory_bank/*`

## Ближайшие шаги

- Построить карту зависимостей по `profiles.id` во всех контентных таблицах и понять, что именно нужно обновлять при восстановлении `auth.users`.
- Сформировать безопасную стратегию миграции orphan-профилей в реальные записи `auth.users`, чтобы Supabase OAuth мог линковать существующие email автоматически.
- Подготовить точечный SQL/кодовый фикс trigger `handle_new_user()`, чтобы конфликты `unique_email` логировались как есть и не маскировались веткой retry по `username`.
- Определить безопасный канал backfill для orphan-профилей: Supabase Admin API `createUser` c `email_confirm=true` и сохранением существующих ролей/метаданных, без потери двух legacy-профилей с публикациями.
- Повторить backfill уже через UI `/profile/oauth-audit` пакетами по 25 пользователей и отдельно наблюдать два профиля с публикациями, чтобы не потерять авторство контента.
- Следующий отдельный этап, если понадобится: вручную спланировать миграцию двух оставшихся orphan-авторов публикаций с отдельной проверкой авторства контента.
- Следующий возможный этап, если понадобится: разобраться с `2` auth users без профильной записи, хотя текущий OAuth-корень по orphan legacy-профилям уже закрыт.
