# Получение Supabase Access Token для MCP

## Проблема

Supabase MCP сервер требует персональный токен доступа (Personal Access Token), а не API keys из проекта.

## Решение

### Шаг 1: Создать Personal Access Token

1. Зайдите в [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
2. Или: Dashboard → Account Settings → Access Tokens
3. Нажмите "Generate New Token"
4. Дайте имя токену (например: "Kiro MCP")
5. Выберите срок действия (рекомендуется: 30 дней или больше)
6. Нажмите "Generate Token"
7. **ВАЖНО:** Скопируйте токен сразу! Он больше не будет показан

### Шаг 2: Обновить конфигурацию MCP

Откройте `.kiro/settings/mcp.json` и добавьте токен:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "ВАШ_ТОКЕН_ЗДЕСЬ"
      },
      "disabled": false,
      "autoApprove": [
        "supabase_list_tables",
        "supabase_describe_table",
        "supabase_list_columns"
      ]
    }
  }
}
```

### Шаг 3: Переподключить MCP сервер

MCP сервер автоматически переподключится при изменении конфигурации.

Или вручную:
- Command Palette (Ctrl+Shift+P) → "MCP: Reconnect Server"
- Или в панели "MCP Server" → кнопка переподключения

### Шаг 4: Проверить подключение

Спросите AI:
```
Покажи все таблицы в Supabase
```

Если MCP работает, AI покажет список таблиц.

## Альтернатива: Настройка вручную

Если MCP не работает, можно настроить Supabase Auth вручную:

1. Откройте [Supabase SQL Editor](https://supabase.com/dashboard/project/jgttwzvrsqnhdysutacc/sql/new)
2. Выполните SQL из файлов:
   - `supabase/01_create_trigger.sql` - создание trigger
   - `supabase/02_setup_rls.sql` - настройка RLS

Или следуйте инструкции в `docs/QUICK_START_SUPABASE_AUTH.md`.

## Безопасность

⚠️ **Personal Access Token дает полный доступ к вашему аккаунту Supabase!**

Рекомендации:
- Не публикуйте токен в git
- Используйте короткий срок действия (30 дней)
- Регулярно обновляйте токен
- Удаляйте неиспользуемые токены

## Troubleshooting

### "Connection closed"
- Проверьте, что токен правильный
- Проверьте, что токен не истек
- Попробуйте создать новый токен

### "Invalid token"
- Убедитесь, что скопировали токен полностью
- Проверьте, что нет лишних пробелов
- Создайте новый токен

### MCP сервер не запускается
- Проверьте, что Node.js установлен
- Проверьте, что npx работает: `npx -v`
- Проверьте логи: Command Palette → "MCP: Show Logs"

## Что дальше?

После успешного подключения MCP:

1. Попросите AI показать структуру базы данных
2. Настройте trigger и RLS через AI
3. Продолжите миграцию согласно `NEXT_STEPS.md`
