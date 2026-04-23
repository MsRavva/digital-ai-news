# Active Context

## Текущий фокус

- Завершено удаление временного диагностического слоя вокруг OAuth; в проекте оставлен только боевой auth-flow с безопасным redirect.
- Локальное TypeScript-окружение восстановлено через `bun install`; `bunx tsc --noEmit` снова проходит успешно.
- Подготовлен и сохранен в `memory_bank` поэтапный план миграции БД и auth с Supabase на Appwrite.
- Markdown-редактор публикаций использует локальный тулбар форматирования без встроенной загрузки изображений в Supabase Storage.
- Документация синхронизирована с удалением `app/api/uploads/post-image` и SQL-конфигурации bucket `post-images` из репозитория.
- Legacy bucket `post-images` и связанные storage policies уже удалены из проекта Supabase через Storage API и SQL cleanup.
- `supabase/06_drop_post_images_bucket.sql` сохранен в репозитории как явный сценарий cleanup для этой инфраструктурной операции.
- Обновлен `AGENTS.md` из актуального источника (Ravva/projects-tracker/main).
- Синхронизирован `memory_bank/projectbrief.md` с реальным состоянием проекта: добавлены детализированные deliverables с корректными весами (сумма = 100).
- Исправлена критическая проблема в форме редактирования постов: несохраненные изменения больше не теряются при потере фокуса окна (Alt-Tab).
- Legacy-проблема orphan-профилей полностью закрыта: все 150 профилей с email выровнены с `auth.users`.
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
- `app/login/page.tsx`
- `app/register/page.tsx`
- `lib/auth-server.ts`
- `components/user-nav.tsx`
- `lib/oauth-profile.ts`
- `lib/post-auth-redirect.ts`
- `lib/auth-helpers.ts`
- `lib/supabase-auth.ts`
- `bun.lock`
- `lib/post-auth-redirect.test.ts`
- `next.config.mjs`
- `types/database.ts`
- `supabase/01_create_trigger.sql`
- `supabase/04_fix_handle_new_user_unique_username.sql`
- `supabase/06_drop_post_images_bucket.sql`
- `memory_bank/ui_extension/pages/auth-pages.md`
- `memory_bank/ui_extension/pages/post-editor.md`
- `docs/README.md`
- `memory_bank/*`

## Ближайшие шаги

- При подтверждении пользователя подготовить детальный `Appwrite technical blueprint` с коллекциями, mapping user IDs, стратегией ролей и cutover-порядком.
- Проверить UX редактора на длинных публикациях и при необходимости отдельно спроектировать новую стратегию работы с изображениями.
- Следующий возможный этап, если понадобится: разобраться с `2` auth users без профильной записи, хотя текущий OAuth-корень по orphan legacy-профилям уже закрыт.
