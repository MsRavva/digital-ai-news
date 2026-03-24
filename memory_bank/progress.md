# Progress

## Контроль изменений

- last_checked_commit: `2d23bef`
- checked_at: `2026-03-24`

## Current Status

- Инициализирован `memory_bank` по структуре из `AGENTS.md`.
- Создан `docs/README.md` как верхнеуровневый источник архитектурной правды.
- Redirect flow упрощен до server-driven схемы с `post_auth_redirect` cookie и `/auth/post-login`.
- Лишние auth debug logs удалены из middleware и login flow.
- Redirect helper покрыт unit-тестами через `bun test`.
- Исправлена валидация auth routes: query string больше не обходит защиту `getSafePostAuthRedirect`.
- `requireAuth(...)` синхронизирован с основным redirect flow и сохраняет маршрут возврата.
- OAuth callback очищает stale redirect-cookie при ошибке, чтобы исключить ложный redirect в следующей попытке входа.
- CSP разрешает `data:`-шрифты для встроенного шрифта markdown-редактора.
- На `/login` добавлен диагностический OAuth panel с persisted шагами, ручным fallback и задержкой финального редиректа до последнего успешного чека.
- На главной странице четвертая иконка в нижнем блоке логотипов больше не зависит от внешнего URL и берется из локального SVG.
- OAuth callback упрощен для ветки GitHub/Google профиля: подтверждение `profiles` теперь идет через линейный `select -> upsert -> confirm` helper без временного `insert/delete`.
- Диагностическое окно OAuth теперь показывает серверные детали по работе с `profiles` в Supabase, включая попытки подтверждения профиля и duplicate-конфликты.
- `AuthProvider` использует единый retry helper для дозагрузки профиля после появления сессии.
- Каждая OAuth-сессия теперь пишется в таблицу `oauth_audit_logs` через клиентский route handler и серверный callback независимо от результата.
- Для `teacher`/`admin` добавлена отдельная страница `/profile/oauth-audit` и пункт меню профиля для просмотра последних OAuth-flow.
- По реальным логам ошибок найден повторяющийся паттерн `Database error saving new user` еще до `code exchange`; исправление смещено в SQL trigger `handle_new_user()`.
- Миграция `fix_handle_new_user_unique_username` успешно применена в Supabase MCP; в базе уже стоит новая версия `public.handle_new_user()`.
- Повторная серверная диагностика через Supabase MCP подтвердила, что после фикса остались два паттерна ошибок: прямой `unique_email` и ложный финальный `failed to create unique profile username`, возникающий из-за слишком широкого `unique_violation` retry в trigger.
- Собрана количественная картина по данным: `150` профилей с email, `48` auth-пользователей с email, `104` orphan-профиля без `auth.users`; только `2` orphan-профиля участвуют в контентных связях через `posts`.
- Подтверждено, что `auth.users` без профиля сейчас всего `2`; основная проблема — именно legacy `profiles` без записей в Auth.
- Реализован серверный backfill orphan-профилей через `supabase.auth.admin.createUser` и SQL-функцию `reassign_profile_id(...)`, доступный для `teacher`/`admin` на странице `/profile/oauth-audit`.
- Миграция `prepare_legacy_profile_backfill` применена в Supabase; trigger `handle_new_user()` теперь читает backfill-флаг из обоих metadata-источников и не маскирует `unique_email` под `username`.
- Выполнен первый боевой backfill-тест на безопасном orphan-профиле без контентных ссылок: `h.nukuta@gmail.com` успешно перенесен в `auth.users`, orphan-профилей осталось `103`, auth users с email стало `49`.
- Автоматический backfill ужесточен по бизнес-правилу: профили с публикациями (`postsCount > 0`) исключаются из пакетного восстановления.
- Массовый backfill для всех orphan-профилей без публикаций завершен успешно: обработано `101` пользователя без ошибок, итог в базе — `150` auth users с email и только `2` оставшихся orphan-профиля, оба с публикациями.
- По отдельному решению пользователя вручную восстановлены и оба оставшихся orphan-автора публикаций: `svasya@ro.ru` (`10` постов) и `eg20master11@gmail.com` (`1` пост) успешно перенесены в `auth.users` с перепривязкой `posts.author_id`.
- Итоговое состояние базы: `0` orphan-профилей, `150` профилей с email выровнены по `auth.users.id`, авторство всех публикаций сохранено.
- Общий Markdown-редактор для `/create` и `/edit/[id]` получил тулбар быстрых действий и переведен на upload изображений в Supabase Storage bucket `post-images`.
- Через Supabase MCP успешно применена миграция `create_post_images_bucket`: bucket `post-images` теперь имеет лимит `4 МБ`, whitelist MIME и storage policies для пользовательских папок.

## Known Issues

- `bun run check` падает на уже существующих форматных расхождениях в репозитории, включая файлы вне текущей задачи.
- В рабочем дереве присутствует удаление `CLAUDE.md`; это изменение не было откатано.
- Локальный unit-тест `lib/post-auth-redirect.test.ts` через голый `node --test` не запускается как ESM без дополнительной настройки резолвинга; ориентиром остаются проектные команды через `bun`.
- GitHub OAuth diagnostic flow требует живой проверки на ученических устройствах; код теперь умеет отличать «браузер не ушел на провайдера» от ошибок callback.
- В рабочем дереве уже были сторонние изменения `package.json` и новый `package-lock.json`; они не относятся к текущей задаче и не изменялись автоматически.
- Для полноценной работы нового аудита SQL из `supabase/03_create_oauth_audit_logs.sql` должен быть применен в базе Supabase.
- Для исправления текущего корня OAuth-сбоя нужно применить SQL из `supabase/04_fix_handle_new_user_unique_username.sql`.
- Нужна повторная живая проверка GitHub OAuth после применения trigger-фикса, чтобы убедиться, что основной паттерн ошибки исчез.
- Для окончательного исправления OAuth нужен backfill отсутствующих `auth.users` для orphan-профилей; без этого automatic identity linking Supabase не сможет использовать существующие email из `public.profiles`.
- Текущий SQL trigger `handle_new_user()` маскирует часть `unique_email` конфликтов как ошибки `username`; это нужно исправить до следующего цикла тестирования.
- Основной объем legacy-проблемы еще не исчерпан: в базе остается `103` orphan-профиля, включая `2` профиля с публикациями, поэтому GitHub OAuth для этих email продолжит падать, пока backfill не будет доведен хотя бы до активных пользователей.
- На текущем этапе legacy-проблема почти исчерпана: остаются только `2` orphan-профиля-автора публикаций, которых нельзя трогать автоматически без отдельного плана миграции контента.
- Legacy-проблема orphan-профилей закрыта; остаточный вопрос — `2` auth users без профиля, не влияющие на текущий OAuth-сбой с `unique_email`.

## Changelog

- 2026-03-12: Добавлен `memory_bank` и синхронизирован с текущим состоянием проекта.
- 2026-03-12: Добавлен `docs/README.md` с описанием архитектуры и auth redirect flow.
- 2026-03-12: Централизован post-auth redirect через cookie и `app/auth/post-login/route.ts`.
- 2026-03-12: Создан commit `5ab531f` с актуальным набором изменений перед финальной синхронизацией памяти.
- 2026-03-12: Удалены лишние `console.log`, добавлены unit-тесты `lib/post-auth-redirect.test.ts`, исправлена фильтрация auth routes с query string.
- 2026-03-12: Создан commit `289671c` с очисткой auth логов и тестами redirect flow.
- 2026-03-12: Исправлен OAuth callback redirect через явную установку auth cookies в redirect response.
- 2026-03-12: Устранены остаточные риски auth-flow: stale redirect-cookie при ошибке OAuth, публичность `/auth/post-login`, server-side redirect через `requireAuth(...)`.
- 2026-03-12: Обновлен CSP для `react-markdown-editor-lite` (`font-src 'self' data:`) и синхронизирован `memory_bank` с commit `f071fff`.
- 2026-03-13: Добавлен диагностический OAuth режим на `/login` с правой панелью шагов, возвратом callback на `/login` и ручным fallback на provider URL.
- 2026-03-13: Исправлена сломанная четвертая иконка в нижнем блоке главной страницы через замену внешнего GitHub SVG на локальный `public/github-icon.svg`.
- 2026-03-17: Упрощен OAuth profile flow после GitHub/Google callback через новый helper `lib/oauth-profile.ts` с диагностикой `select/upsert/confirm` для Supabase `profiles`.
- 2026-03-17: OAuth debug panel расширен серверными диагностическими сообщениями по шагам callback и состоянию профиля.
- 2026-03-17: `AuthProvider` переведен на единый retry helper загрузки профиля после появления Supabase session.
- 2026-03-17: Добавлена постоянная запись OAuth-сессий в `oauth_audit_logs` и teacher/admin страница `/profile/oauth-audit` для просмотра логов.
- 2026-03-17: По логам OAuth выявлен trigger-level сбой `Database error saving new user`; добавлена SQL-правка `handle_new_user()` с retry по уникальному username и уточненная диагностика callback.
- 2026-03-17: Через Supabase MCP применена миграция `fix_handle_new_user_unique_username`, подтверждено обновленное определение функции `public.handle_new_user()`.
- 2026-03-17: Дополнительная диагностика через Supabase MCP показала, что после trigger-фикса сохранились конфликты `unique_email`; собрана карта зависимостей `profiles.id` и подтверждена системная проблема `104` orphan-профилей без `auth.users`.
- 2026-03-17: Добавлены `lib/orphan-auth-backfill.ts`, API `/api/admin/orphan-profiles/backfill` и teacher/admin блок на `/profile/oauth-audit` для пакетного восстановления orphan-профилей.
- 2026-03-17: Применена миграция `prepare_legacy_profile_backfill`; первый живой backfill успешно перепривязал профиль `h.nukuta@gmail.com` к новому `auth.users.id`.
- 2026-03-17: По уточнению пользователя автоматический backfill ограничен только профилями без публикаций; затем массово восстановлены все такие orphan-пользователи (`101` успешный перенос, `0` ошибок).
- 2026-03-17: По отдельному указанию пользователя вручную восстановлены два orphan-автора публикаций; публикации успешно перепривязаны на новые `auth.users.id`, orphan legacy-профили в базе устранены полностью.
- 2026-03-23: Обновлен `AGENTS.md` из актуального источника GitHub (Ravva/projects-tracker).
- 2026-03-23: Обновлен `memory_bank/projectbrief.md` с детализированными deliverables на основе `docs/README.md` и фактического состояния проекта.
- 2026-03-23: Исправлена проблема потери несохраненных изменений в редакторе постов при потере фокуса (Alt-Tab) через добавление флага `isPostLoaded` в `components/edit-post-form.tsx`.
- 2026-03-24: Добавлены Markdown-тулбар и встроенная вставка изображений в общий `components/ui/markdown-editor.tsx`; рендер `components/ui/markdown-content.tsx` расширен поддержкой `data:image/...`, обновлены `docs/README.md` и `memory_bank/ui_extension/pages/post-editor.md`.
- 2026-03-24: Вставка изображений переведена на upload в Supabase Storage через `app/api/uploads/post-image/route.ts`; добавлен SQL `supabase/06_create_post_images_bucket.sql` для bucket `post-images` и storage policies, обновлены `docs/README.md` и `memory_bank`.
- 2026-03-24: Через Supabase MCP применена миграция `create_post_images_bucket`; подтверждены лимит `4 МБ`, whitelist типов и policies `SELECT/INSERT/UPDATE/DELETE` для bucket `post-images`.
