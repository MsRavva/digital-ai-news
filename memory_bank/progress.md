# Progress

## Контроль изменений

- last_checked_commit: `f071fff02eb03b92bcac967e98a38e3e5e8cb40c`
- checked_at: `2026-03-12`

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

## Known Issues

- `bun run check` падает на уже существующих форматных расхождениях в репозитории, включая файлы вне текущей задачи.
- В рабочем дереве присутствует удаление `CLAUDE.md`; это изменение не было откатано.
- Локальный unit-тест `lib/post-auth-redirect.test.ts` через голый `node --test` не запускается как ESM без дополнительной настройки резолвинга; ориентиром остаются проектные команды через `bun`.

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
