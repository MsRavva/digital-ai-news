# Progress

## Контроль изменений

- last_checked_commit: `0329033`
- checked_at: `2026-03-17`

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

## Known Issues

- `bun run check` падает на уже существующих форматных расхождениях в репозитории, включая файлы вне текущей задачи.
- В рабочем дереве присутствует удаление `CLAUDE.md`; это изменение не было откатано.
- Локальный unit-тест `lib/post-auth-redirect.test.ts` через голый `node --test` не запускается как ESM без дополнительной настройки резолвинга; ориентиром остаются проектные команды через `bun`.
- GitHub OAuth diagnostic flow требует живой проверки на ученических устройствах; код теперь умеет отличать «браузер не ушел на провайдера» от ошибок callback.
- В рабочем дереве уже были сторонние изменения `package.json` и новый `package-lock.json`; они не относятся к текущей задаче и не изменялись автоматически.
- Для полноценной работы нового аудита SQL из `supabase/03_create_oauth_audit_logs.sql` должен быть применен в базе Supabase.
- Для исправления текущего корня OAuth-сбоя нужно применить SQL из `supabase/04_fix_handle_new_user_unique_username.sql`.
- Нужна повторная живая проверка GitHub OAuth после применения trigger-фикса, чтобы убедиться, что основной паттерн ошибки исчез.

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
