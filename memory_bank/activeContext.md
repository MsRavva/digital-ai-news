# Active Context

## Текущий фокус

- Markdown-редактор публикаций использует локальный тулбар форматирования без встроенной загрузки изображений в Supabase Storage.
- Документация синхронизирована с удалением `app/api/uploads/post-image` и SQL-конфигурации bucket `post-images` из репозитория.
- Legacy bucket `post-images` и связанные storage policies уже удалены из проекта Supabase через Storage API и SQL cleanup.
- `supabase/06_drop_post_images_bucket.sql` сохранен в репозитории как явный сценарий cleanup для этой инфраструктурной операции.
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
- Для изображений в публикациях использовать стандартный Markdown с внешними URL, без встроенного upload в Supabase Storage.

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
- `supabase/06_drop_post_images_bucket.sql`
- `lib/orphan-auth-backfill.ts`
- `components/oauth-orphan-backfill-card.tsx`
- `app/api/admin/orphan-profiles/backfill/route.ts`
- `memory_bank/ui_extension/pages/auth-pages.md`
- `memory_bank/ui_extension/pages/oauth-audit.md`
- `memory_bank/ui_extension/pages/post-editor.md`
- `public/github-icon.svg`
- `docs/README.md`
- `memory_bank/*`

## Ближайшие шаги

- Проверить UX редактора на длинных публикациях и при необходимости отдельно спроектировать новую стратегию работы с изображениями.
- Следующий возможный этап, если понадобится: разобраться с `2` auth users без профильной записи, хотя текущий OAuth-корень по orphan legacy-профилям уже закрыт.
