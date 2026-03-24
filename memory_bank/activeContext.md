# Active Context

## Текущий фокус

- Завершен перевод редактора публикаций на Supabase Storage: Markdown-тулбар работает, изображения загружаются через API в bucket `post-images`, а bucket/policies применены в проект Supabase через MCP.
- Обновлен `AGENTS.md` из актуального источника (Ravva/projects-tracker/main).
- Синхронизирован `memory_bank/projectbrief.md` с реальным состоянием проекта: добавлены детализированные deliverables с корректными весами (сумма = 100).
- Исправлена критическая проблема в форме редактирования постов: несохраненные изменения больше не теряются при потере фокуса окна (Alt-Tab).
- Legacy-проблема orphan-профилей полностью закрыта: все 150 профилей с email выровнены с `auth.users`.
- OAuth flow стабилизирован с полным audit logging для teacher/admin.
- Система Memory Bank актуализирована согласно правилам из обновленного `AGENTS.md`.

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
- `app/api/uploads/post-image/route.ts`
- `memory_bank/ui_extension/pages/auth-pages.md`
- `memory_bank/ui_extension/pages/oauth-audit.md`
- `memory_bank/ui_extension/pages/post-editor.md`
- `supabase/06_create_post_images_bucket.sql`
- `public/github-icon.svg`
- `docs/README.md`
- `memory_bank/*`

## Ближайшие шаги

- Проверить UX редактора на длинных публикациях и при необходимости добавить drag-and-drop вставку изображений отдельной задачей.
- Построить карту зависимостей по `profiles.id` во всех контентных таблицах и понять, что именно нужно обновлять при восстановлении `auth.users`.
- Сформировать безопасную стратегию миграции orphan-профилей в реальные записи `auth.users`, чтобы Supabase OAuth мог линковать существующие email автоматически.
- Подготовить точечный SQL/кодовый фикс trigger `handle_new_user()`, чтобы конфликты `unique_email` логировались как есть и не маскировались веткой retry по `username`.
- Определить безопасный канал backfill для orphan-профилей: Supabase Admin API `createUser` c `email_confirm=true` и сохранением существующих ролей/метаданных, без потери двух legacy-профилей с публикациями.
- Повторить backfill уже через UI `/profile/oauth-audit` пакетами по 25 пользователей и отдельно наблюдать два профиля с публикациями, чтобы не потерять авторство контента.
- Следующий отдельный этап, если понадобится: вручную спланировать миграцию двух оставшихся orphan-авторов публикаций с отдельной проверкой авторства контента.
- Следующий возможный этап, если понадобится: разобраться с `2` auth users без профильной записи, хотя текущий OAuth-корень по orphan legacy-профилям уже закрыт.
