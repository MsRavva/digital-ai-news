# Active Context

- Физическая миграция данных из Supabase в Appwrite выполнена: перенесены profiles/posts/tags/post_tags/likes/views, создана таблица `comment_likes`, связи проверены на целостность.
- Пользователь подтвердил успешный перенос после визуальной проверки данных в Appwrite.

## Текущий фокус

- `DA-10..DA-13` закрыты: read-path, auth/session/role checks, write-path, comment likes и документация переведены на Appwrite runtime.
- Runtime по умолчанию переключен на Appwrite; Supabase сохранен только как rollback-ветка через `NEXT_PUBLIC_BACKEND_PROVIDER=supabase`.
- Выполняется rollback-friendly cleanup: из документации и memory убираются устаревшие указания про Supabase как основной runtime, но сам fallback-код и legacy-артефакты сохраняются.
- Устранено Next warning по deprecated middleware convention: runtime guard перенесен из `middleware.ts` в `proxy.ts` без изменения поведения маршрутизации.
- Исправлен Appwrite OAuth init для GitHub/Google: server-side подготовка OAuth URL больше не зависит от `NEXT_PUBLIC_APPWRITE_*` и строит callback от текущего `request.origin`.
- После успешной настройки GitHub/Google OAuth выявлена и исправлена гонка `/api/auth/appwrite/me`: параллельные запросы после OAuth больше не должны приводить к 500 при одновременном создании Appwrite `profiles`.
- Текущий Google OAuth сбой `redirect_uri_mismatch` локализован во внешней настройке Google Cloud: в Authorized redirect URIs должен быть Appwrite callback `https://<region>.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/<project-id>`, а не callback домена Next.js или старый Supabase callback.
- Документация quick start/deploy/testing синхронизируется под Appwrite OAuth, чтобы не возвращаться к устаревшим Supabase redirect URI.
- Для legacy-профиля `svasya@ro.ru` создан недостающий Appwrite Auth user с тем же id, что и `profiles.$id`; пароль установлен через Users API. Прямой Appwrite email/password session creation с этим паролем проходит успешно.
- Найден и исправлен клиентский Appwrite auth UX-дефект: после email-login `AuthProvider` теперь сразу обновляет `user/profile`, чтобы главная страница не зависала на состоянии `Перенаправление...`.
- Общий auth error handler больше не пишет в консоль `Обработка ошибки Supabase` для Appwrite-ошибок.
- `DA-13` закрыт: runtime по умолчанию переключен на Appwrite, comment likes добавлены в Appwrite schema, документация и memory bank синхронизированы под финальное состояние cutover.
- Синхронизируется локальный `AGENTS.md` из актуального источника `Ravva/projects-tracker`, а `memory_bank` перепроверяется на соответствие правилам deliverables и контролю изменений.
- Завершено удаление временного диагностического слоя вокруг OAuth; в проекте оставлен только боевой auth-flow с безопасным redirect.
- Локальное TypeScript-окружение восстановлено через `bun install`; `bunx tsc --noEmit` снова проходит успешно.
- Подготовлен и сохранен в `memory_bank` поэтапный план миграции БД и auth с Supabase на Appwrite.
- Пользователь подтвердил целевое Appwrite-окружение; конкретные endpoint/project id вынесены в локальный `.env` и не должны храниться в коммитящихся docs/memory.
- В работу взята phase 1 миграции: `Appwrite technical blueprint` и provider-agnostic service layer.
- UI-слой уже переведен на внутренние фасады `lib/services/auth|posts|comments|admin`; прямые импорты `@/lib/supabase-*` из `app/`, `components/` и `context/` для основных сценариев убраны.
- Appwrite TablesDB schema создана через `scripts/setup-appwrite-schema.ts`; локальный `.env` дополнен database/table ids без фиксации значений в docs/memory.
- Приложение теперь должно работать на Appwrite по умолчанию; явное значение `NEXT_PUBLIC_BACKEND_PROVIDER=supabase` рассматривается только как rollback-механизм.
- По подтверждению пользователя удаляются legacy-хвосты локальных agent/editor/CI-настроек: `.claude`, `.cursor`, `.github`, `.kiro`, `.vscode`.
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
- Строить миграцию на Appwrite через внутренние сервисы `lib/services/*`, не переподключая UI напрямую к новому SDK.
- Полный auth cutover выполнять только после реализации Appwrite session endpoints и server guards; текущий рабочий Supabase auth пока не переключать.
- Для Appwrite auth cutover использовать forced relink: при первом Appwrite login/register/OAuth профиль в `profiles` восстанавливается или перепривязывается по email, с переносом `legacySupabaseUserId`, `username` и `role`.
- Для быстрого rollback не удалять `lib/supabase-*`, `supabase/*.sql` и Supabase env contract, пока не закончится окно стабилизации после cutover.

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
- `.claude/settings.local.json`
- `.cursor/mcp.json`
- `.cursor/rules/ts.mdc`
- `.github/workflows/fetch-news.yml`
- `.kiro/settings/mcp.json`
- `.kiro/steering/ts.md`
- `.vscode/settings.json`
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

- Реализовать Appwrite read adapters для posts/comments/admin через `TablesDB` и сохранить совместимость текущего UI-контракта `types/database.ts`.
- Следующий этап: перенести auth/session/role checks на Appwrite и убрать временную зависимость Appwrite read proxy от Supabase session.
- Следующий этап: перенести write-path и admin mutations на Appwrite, используя уже переключенные Appwrite auth/session/role guards.
- Следующий этап: финальный cutover, добор тестового покрытия и удаление Supabase legacy после решения по `comment_likes` и проверок smoke-flow на реальных пользователях.
- Следующий отдельный этап, если понадобится: сузить rollback window и начать физический cleanup `lib/supabase-*`, `supabase/*.sql` и Supabase env после периода стабилизации.
- Зафиксировать и отправить в remote синхронизацию `AGENTS.md` и `memory_bank` после проверки deliverables.
- Зафиксировать детальный `Appwrite technical blueprint` в `docs/APPWRITE_TECHNICAL_BLUEPRINT.md` и синхронизировать `memory_bank`.
- Вынести provider-agnostic слой для auth, posts, comments и admin сценариев.
- Следующий технический шаг: реализовать Appwrite read adapters для posts/comments/admin через `TablesDB`, не переключая auth.
- Проверить UX редактора на длинных публикациях и при необходимости отдельно спроектировать новую стратегию работы с изображениями.
- Следующий возможный этап, если понадобится: разобраться с `2` auth users без профильной записи, хотя текущий OAuth-корень по orphan legacy-профилям уже закрыт.
