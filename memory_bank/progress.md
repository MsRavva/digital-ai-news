# Progress

## Контроль изменений
last_checked_commit: da3ffdf

## Changelog
- 2026-07-04: Замена textarea-редактора на Plate.js rich text editor (WYSIWYG, split-режим, toolbar с группировкой кнопок и разделителями).
- 2026-07-04: Стилизация Plate.js редактора под дизайн-систему проекта (CSS-overrides для тем light/dark, отступы `px-4 py-3`, рамка `border-border` как в блоке Предпросмотр).
- 2026-07-04: Добавлен `TooltipProvider` в корневой `layout.tsx` для работы тултипов Plate.js.
- 2026-07-04: Установлены зависимости Plate.js: `@platejs/editor-ai`, `@platejs/markdown`, `remark-gfm`.
- 2026-06-25: Добавлен хост Appwrite `https://aw.note-canopus.ts.net` в CSP `connect-src` в `next.config.mjs` для работы в Vercel-проде.
- 2026-06-25: Исправлены вызовы OAuth-функций Google/Github на клиенте, восстановлено перенаправление браузера (`window.location.assign`).
- 2026-06-24: Ограничено использование динамического origin при генерации callback URL только для localhost (исправлена ошибка 'Invalid redirect' на Vercel).
- 2026-06-24: Исправлена кука сессии Appwrite (SameSite изменен с Strict на Lax для надежной передачи при OAuth редиректах).
- 2026-06-24: Приоритет origin повышен над NEXT_PUBLIC_AUTH_CALLBACK_URL для корректного OAuth-логина на localhost.
- 2026-06-11: Заменен локальный AGENTS.md, очищены лишние папки и файлы из memory_bank.
- 2026-06-11: Интегрирован шрифт JetBrains Mono с поддержкой кириллицы для pre/code без лигатур.
- 2026-06-11: Успешно завершен перенос БД и Auth-пользователей с Appwrite Cloud на собственный инстанс.
