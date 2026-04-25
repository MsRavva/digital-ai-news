# Progress

## Контроль изменений

- last_checked_commit: `9049380fbcff29fc06d3f46088204f5d1e406458`
- checked_at: `2026-04-25`

## Current Status

- Инициализирован `memory_bank` по структуре из `AGENTS.md`.
- Создан `docs/README.md` как верхнеуровневый источник архитектурной правды.
- Подтвержден новый проектный scope: миграция backend-слоя с Supabase на Appwrite.
- Подготовлен отдельный `Appwrite technical blueprint`; Appwrite endpoint/project id вынесены в локальный `.env`, чтобы не хранить их в коммитящихся docs/memory.
- Добавлен provider-agnostic service layer (`lib/services/*`) и каркас `lib/appwrite/*`; основные UI-страницы и компоненты переведены на внутренние сервисы вместо прямых импортов Supabase helper-файлов.
- Appwrite TablesDB schema создана idempotent-скриптом `scripts/setup-appwrite-schema.ts`; локальный `.env` обновлен database/table ids.
- Runtime приложения переключен на Appwrite по умолчанию; Supabase оставлен только как rollback-ветка и источник forced relink по email на миграционный период.
- По подтверждению пользователя удаляются legacy-хвосты локальных agent/editor/CI-настроек: `.claude`, `.cursor`, `.github`, `.kiro`, `.vscode`.
- Локальное TypeScript-окружение восстановлено: зависимости установлены через `bun`, удалены остаточные debug-компоненты, `bunx tsc --noEmit` снова проходит.
- Redirect flow упрощен до server-driven схемы с `post_auth_redirect` cookie и `/auth/post-login`.
- Лишние auth debug logs удалены из middleware и login flow.
- Redirect helper покрыт unit-тестами через `bun test`.
- Исправлена валидация auth routes: query string больше не обходит защиту `getSafePostAuthRedirect`.
- `requireAuth(...)` синхронизирован с основным redirect flow и сохраняет маршрут возврата.
- OAuth callback очищает stale redirect-cookie при ошибке, чтобы исключить ложный redirect в следующей попытке входа.
- Временный диагностический слой вокруг OAuth полностью удален из кода, маршрутов, типов, SQL и документации.
- CSP разрешает `data:`-шрифты для встроенного шрифта markdown-редактора.
- На главной странице четвертая иконка в нижнем блоке логотипов больше не зависит от внешнего URL и берется из локального SVG.
- OAuth callback упрощен для ветки GitHub/Google профиля: подтверждение `profiles` теперь идет через линейный `select -> upsert -> confirm` helper без временного `insert/delete`.
- `AuthProvider` использует единый retry helper для дозагрузки профиля после появления сессии.
- По реальным логам ошибок найден повторяющийся паттерн `Database error saving new user` еще до `code exchange`; исправление смещено в SQL trigger `handle_new_user()`.
- Миграция `fix_handle_new_user_unique_username` успешно применена в Supabase MCP; в базе уже стоит новая версия `public.handle_new_user()`.
- Повторная серверная диагностика через Supabase MCP подтвердила, что после фикса остались два паттерна ошибок: прямой `unique_email` и ложный финальный `failed to create unique profile username`, возникающий из-за слишком широкого `unique_violation` retry в trigger.
- Собрана количественная картина по данным: `150` профилей с email, `48` auth-пользователей с email, `104` orphan-профиля без `auth.users`; только `2` orphan-профиля участвуют в контентных связях через `posts`.
- Подтверждено, что `auth.users` без профиля сейчас всего `2`; основная проблема — именно legacy `profiles` без записей в Auth.
- Миграция `prepare_legacy_profile_backfill` применена в Supabase; trigger `handle_new_user()` теперь читает backfill-флаг из обоих metadata-источников и не маскирует `unique_email` под `username`.
- Выполнен первый боевой backfill-тест на безопасном orphan-профиле без контентных ссылок: `h.nukuta@gmail.com` успешно перенесен в `auth.users`, orphan-профилей осталось `103`, auth users с email стало `49`.
- Автоматический backfill ужесточен по бизнес-правилу: профили с публикациями (`postsCount > 0`) исключаются из пакетного восстановления.
- Массовый backfill для всех orphan-профилей без публикаций завершен успешно: обработано `101` пользователя без ошибок, итог в базе — `150` auth users с email и только `2` оставшихся orphan-профиля, оба с публикациями.
- По отдельному решению пользователя вручную восстановлены и оба оставшихся orphan-автора публикаций: `svasya@ro.ru` (`10` постов) и `eg20master11@gmail.com` (`1` пост) успешно перенесены в `auth.users` с перепривязкой `posts.author_id`.
- Итоговое состояние базы: `0` orphan-профилей, `150` профилей с email выровнены по `auth.users.id`, авторство всех публикаций сохранено.
- Общий Markdown-редактор для `/create` и `/edit/[id]` использует тулбар быстрых действий без встроенной загрузки изображений в Supabase Storage.
- Локальный `AGENTS.md` повторно синхронизирован с актуальным источником `Ravva/projects-tracker`; `memory_bank/projectbrief.md` перепроверен, раздел `## Project Deliverables` сохранен в табличной форме, а сумма весов подтверждена как `100`.
- Реализован Appwrite `read-path` через server-side proxy: добавлены route handlers `app/api/appwrite/*`, server adapters `lib/appwrite/read.ts`, а `lib/services/posts|comments|admin` переведены на эти endpoints при `NEXT_PUBLIC_BACKEND_PROVIDER=appwrite`.
- Реализован Appwrite auth cutover с forced relink: добавлены `/api/auth/appwrite/*`, Appwrite session cookie flow, OAuth/recovery endpoints, middleware/guards для `a_session_<projectId>` и upsert legacy-профиля по email при первом входе.
- Реализован Appwrite write-path: добавлены `lib/appwrite/write.ts`, route handlers для write-сценариев posts/comments/profile, а `lib/services/posts.ts`, `lib/services/comments.ts`, `lib/services/auth.ts` и preference helpers переведены на Appwrite endpoints при `NEXT_PUBLIC_BACKEND_PROVIDER=appwrite`.
- Appwrite schema и runtime финализированы для cutover: добавлена поддержка `comment_likes`, default provider переключен на Appwrite, `docs/README.md` и `memory_bank` синхронизированы под финальное состояние.
- Rollback window остается открытым: Supabase fallback helpers и SQL-артефакты сознательно сохранены в репозитории, хотя основной runtime уже переведен на Appwrite.
- Устранен build warning про deprecated `middleware` convention: guard перенесен в `proxy.ts`; production build проходит без этого предупреждения.

## Known Issues

- `bun run check` падает на уже существующих форматных расхождениях в репозитории, включая файлы вне текущей задачи.
- `bun run check` по-прежнему падает на существующих форматных расхождениях вне текущего набора файлов, поэтому окончательный smoke/barrier для merge опирается на `bunx tsc --noEmit` и точечный `biome --write`.
- Next build продолжает выводить warning про устаревший `baseline-browser-mapping`, потому что в dependency tree остается вложенная старая версия; warning не блокирует сборку и не связан с runtime логикой приложения.
- В рабочем дереве присутствует удаление `CLAUDE.md`; это изменение не было откатано.
- Локальный unit-тест `lib/post-auth-redirect.test.ts` через голый `node --test` не запускается как ESM без дополнительной настройки резолвинга; ориентиром остаются проектные команды через `bun`.
- В рабочем дереве уже были сторонние изменения `package.json` и новый `package-lock.json`; они не относятся к текущей задаче и не изменялись автоматически.
- Legacy-проблема orphan-профилей закрыта; остаточный вопрос — `2` auth users без профиля, не влияющие на текущий OAuth-сбой с `unique_email`.
- Код загрузки изображений постов в Supabase Storage удален из репозитория; дальнейшая работа с изображениями в публикациях возможна только через внешние URL в Markdown.
- `last_checked_commit` из предыдущей записи оказался несинхронизирован с текущей историей после `git pull`; контроль изменений переведен на актуальный `HEAD`.
- Forced relink опирается на доступность Supabase `profiles` по email через server-side admin client; это сознательно сохранено как миграционный safety-net в rollback window.

## Changelog

- 2026-04-23: Подтверждены Appwrite endpoint/project id, создан `docs/APPWRITE_TECHNICAL_BLUEPRINT.md`, обновлены `docs/README.md` и `memory_bank` под новый scope миграции с Supabase на Appwrite.
- 2026-04-23: По замечанию пользователя Appwrite endpoint/project id удалены из коммитящихся docs/memory и перенесены в локальный `.env`; Appwrite SDK helpers переведены на `TablesDB` согласно `appwrite-typescript` skill.
- 2026-04-23: Добавлен и выполнен `scripts/setup-appwrite-schema.ts`; в Appwrite создана TablesDB schema для `profiles`, `posts`, `tags`, `post_tags`, `comments`, `likes`, `views`, а локальный `.env` дополнен ids ресурсов.
- 2026-04-23: Установлены `appwrite` и `node-appwrite`, добавлены `lib/appwrite/*` и `lib/services/*`, auth/posts/comments/admin UI переведены на provider-agnostic слой; `bunx biome check --write` и `bunx tsc --noEmit` прошли успешно.
- 2026-04-23: По подтверждению пользователя удалены legacy-хвосты локальных agent/editor/CI-настроек: `.claude`, `.cursor`, `.github`, `.kiro`, `.vscode`.
- 2026-04-23: Восстановлено локальное TypeScript-окружение через `bun install`, удален последний забытый debug-компонент OAuth, актуализирован `memory_bank`, подтвержден успешный `bunx tsc --noEmit`.
- 2026-04-23: Из проекта удален временный диагностический слой вокруг OAuth, включая дополнительные UI/API-маршруты, служебные SQL-файлы, типы и документацию; боевой auth-flow сохранен.
- 2026-04-23: В `memory_bank/other/appwrite-migration-plan.md` сохранен поэтапный план миграции БД и auth с Supabase на Appwrite с рисками, этапами и порядком cutover.
- 2026-03-12: Добавлен `memory_bank` и синхронизирован с текущим состоянием проекта.
- 2026-03-12: Добавлен `docs/README.md` с описанием архитектуры и auth redirect flow.
- 2026-03-12: Централизован post-auth redirect через cookie и `app/auth/post-login/route.ts`.
- 2026-03-12: Создан commit `5ab531f` с актуальным набором изменений перед финальной синхронизацией памяти.
- 2026-03-12: Удалены лишние `console.log`, добавлены unit-тесты `lib/post-auth-redirect.test.ts`, исправлена фильтрация auth routes с query string.
- 2026-03-12: Создан commit `289671c` с очисткой auth логов и тестами redirect flow.
- 2026-03-12: Исправлен OAuth callback redirect через явную установку auth cookies в redirect response.
- 2026-03-12: Устранены остаточные риски auth-flow: stale redirect-cookie при ошибке OAuth, публичность `/auth/post-login`, server-side redirect через `requireAuth(...)`.
- 2026-03-12: Обновлен CSP для `react-markdown-editor-lite` (`font-src 'self' data:`) и синхронизирован `memory_bank` с commit `f071fff`.
- 2026-03-13: В проект временно добавлялся диагностический режим OAuth на `/login` для расследования проблем callback и redirect.
- 2026-03-13: Исправлена сломанная четвертая иконка в нижнем блоке главной страницы через замену внешнего GitHub SVG на локальный `public/github-icon.svg`.
- 2026-03-17: Упрощен OAuth profile flow после GitHub/Google callback через новый helper `lib/oauth-profile.ts` с диагностикой `select/upsert/confirm` для Supabase `profiles`.
- 2026-03-17: Временный диагностический UI для OAuth был расширен серверными сообщениями по шагам callback и состоянию профиля.
- 2026-03-17: `AuthProvider` переведен на единый retry helper загрузки профиля после появления Supabase session.
- 2026-03-17: Для расследования сбоев вокруг OAuth временно были добавлены серверная трассировка flow и отдельная teacher/admin страница просмотра логов.
- 2026-03-17: По логам OAuth выявлен trigger-level сбой `Database error saving new user`; добавлена SQL-правка `handle_new_user()` с retry по уникальному username и уточненная диагностика callback.
- 2026-03-17: Через Supabase MCP применена миграция `fix_handle_new_user_unique_username`, подтверждено обновленное определение функции `public.handle_new_user()`.
- 2026-03-17: Дополнительная диагностика через Supabase MCP показала, что после trigger-фикса сохранились конфликты `unique_email`; собрана карта зависимостей `profiles.id` и подтверждена системная проблема `104` orphan-профилей без `auth.users`.
- 2026-03-17: Для закрытия legacy-рассинхронизации между `profiles` и `auth.users` был добавлен временный пакетный инструмент восстановления orphan-профилей.
- 2026-03-17: Применена миграция `prepare_legacy_profile_backfill`; первый живой backfill успешно перепривязал профиль `h.nukuta@gmail.com` к новому `auth.users.id`.
- 2026-03-17: По уточнению пользователя автоматический backfill ограничен только профилями без публикаций; затем массово восстановлены все такие orphan-пользователи (`101` успешный перенос, `0` ошибок).
- 2026-03-17: По отдельному указанию пользователя вручную восстановлены два orphan-автора публикаций; публикации успешно перепривязаны на новые `auth.users.id`, orphan legacy-профили в базе устранены полностью.
- 2026-03-23: Обновлен `AGENTS.md` из актуального источника GitHub (Ravva/projects-tracker).
- 2026-03-23: Обновлен `memory_bank/projectbrief.md` с детализированными deliverables на основе `docs/README.md` и фактического состояния проекта.
- 2026-03-23: Исправлена проблема потери несохраненных изменений в редакторе постов при потере фокуса (Alt-Tab) через добавление флага `isPostLoaded` в `components/edit-post-form.tsx`.
- 2026-03-24: Добавлены Markdown-тулбар и встроенная вставка изображений в общий `components/ui/markdown-editor.tsx`; рендер `components/ui/markdown-content.tsx` расширен поддержкой `data:image/...`, обновлены `docs/README.md` и `memory_bank/ui_extension/pages/post-editor.md`.
- 2026-03-24: Вставка изображений переведена на upload в Supabase Storage через `app/api/uploads/post-image/route.ts`; добавлен SQL `supabase/06_create_post_images_bucket.sql` для bucket `post-images` и storage policies, обновлены `docs/README.md` и `memory_bank`.
- 2026-03-24: Через Supabase MCP применена миграция `create_post_images_bucket`; подтверждены лимит `4 МБ`, whitelist типов и policies `SELECT/INSERT/UPDATE/DELETE` для bucket `post-images`.
- 2026-04-23: Удален встроенный upload изображений постов в Supabase Storage: из редактора убраны file picker и API `/api/uploads/post-image`, из репозитория удален SQL `supabase/06_create_post_images_bucket.sql`, документация синхронизирована под использование только внешних URL в Markdown.
- 2026-04-23: Добавлен `supabase/06_drop_post_images_bucket.sql` для ручного удаления legacy bucket `post-images`, его объектов и storage policies в окружении Supabase.
- 2026-04-23: Через Supabase MCP и Storage API удален legacy bucket `post-images`; дополнительной проверкой подтверждено, что bucket и связанные policies больше не существуют в проекте Supabase.
- 2026-04-25: Локальный `AGENTS.md` обновлен из `Ravva/projects-tracker`, `memory_bank` синхронизирован после чистого `git pull`, а `projectbrief.md` повторно проверен на наличие корректной таблицы `Project Deliverables` с суммой весов `100`.
- 2026-04-25: Настроен и повторно аутентифицирован `Supabase MCP` в `opencode`; подтверждено подключение remote MCP server для проекта `jgttwzvrsqnhdysutacc`.
- 2026-04-25: Выполнен перенос `read-path` на Appwrite без auth cutover: добавлены `lib/appwrite/read.ts`, `lib/appwrite/tables.ts`, `lib/appwrite/route-guards.ts`, route handlers `app/api/appwrite/*`, а чтение в `lib/services/posts.ts`, `lib/services/comments.ts`, `lib/services/admin.ts` переключено на server proxy при `NEXT_PUBLIC_BACKEND_PROVIDER=appwrite`; `bunx biome check --write` и `bunx tsc --noEmit` прошли успешно.
- 2026-04-25: Выполнен `DA-11` через forced relink strategy: добавлены `lib/appwrite/auth.ts`, endpoints `/api/auth/appwrite/login|register|me|logout|recovery`, Appwrite OAuth init/callback через `app/auth/callback/route.ts`, Appwrite session guards в `middleware.ts` и `lib/auth-server.ts`, а `lib/services/auth.ts` и `context/auth-context.tsx` переключены на внутренний Appwrite auth bridge; `bunx biome check --write` и `bunx tsc --noEmit` прошли успешно.
- 2026-04-25: Выполнен `DA-12`: добавлены `lib/appwrite/write.ts` и write-endpoints `app/api/appwrite/posts/*`, `app/api/appwrite/comments/*`, `app/api/appwrite/profile`; создание/редактирование/архивация/удаление постов, просмотры и лайки постов, создание/удаление комментариев, обновление профиля и пользовательских preferences переведены на Appwrite; `bunx biome check --write` и `bunx tsc --noEmit` прошли успешно.
- 2026-04-25: Выполнен `DA-13`: Appwrite schema расширена таблицей `comment_likes`, comment-like flow переведен на Appwrite, provider по умолчанию переключен на Appwrite через `lib/backend-provider.ts`, а `docs/README.md` и `memory_bank` синхронизированы под финальное состояние cutover; `bunx biome check --write` и `bunx tsc --noEmit` прошли успешно.
- 2026-04-25: Выполнен rollback-friendly cleanup: устаревшие указания про Supabase как основной runtime удалены из `docs/README.md`, `docs/APPWRITE_TECHNICAL_BLUEPRINT.md` и `memory_bank`, при этом Supabase fallback-код и зависимости сохранены для быстрого отката.
- 2026-04-25: Для совместимости с актуальным Next runtime guard перенесен из `middleware.ts` в `proxy.ts`, CSP в `next.config.mjs` расширен под Appwrite endpoint, а dev dependency `baseline-browser-mapping` обновлена до `2.10.22`; `bunx tsc --noEmit` и `bun run build` проходят успешно.
