# Progress

## Контроль изменений
last_checked_commit: cdd2edd09fa6095a3567e6887763a57c0448d60a

## Changelog
- 2026-06-24: Ограничено использование динамического origin при генерации callback URL только для localhost (исправлена ошибка 'Invalid redirect' на Vercel).
- 2026-06-24: Исправлена кука сессии Appwrite (SameSite изменен с Strict на Lax для надежной передачи при OAuth редиректах).
- 2026-06-24: Приоритет origin повышен над NEXT_PUBLIC_AUTH_CALLBACK_URL для корректного OAuth-логина на localhost.
- 2026-06-11: Заменен локальный AGENTS.md, очищены лишние папки и файлы из memory_bank.
- 2026-06-11: Интегрирован шрифт JetBrains Mono с поддержкой кириллицы для pre/code без лигатур.
- 2026-06-11: Успешно завершен перенос БД и Auth-пользователей с Appwrite Cloud на собственный инстанс.
