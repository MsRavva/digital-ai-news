# Настройка Supabase MCP

## Что такое Supabase MCP?

Supabase MCP (Model Context Protocol) - это инструмент, который позволяет AI ассистентам (например, Kiro) напрямую взаимодействовать с вашей базой данных Supabase через специальный протокол.

## Преимущества

✅ Прямой доступ к базе данных из AI ассистента  
✅ Автоматическое выполнение SQL запросов  
✅ Просмотр схемы базы данных  
✅ Создание и изменение таблиц  
✅ Управление данными  

## Настройка

### 1. Конфигурация MCP

Файл `.kiro/settings/mcp.json` уже создан:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=jgttwzvrsqnhdysutacc",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### 2. Параметры конфигурации

- **url** - URL вашего Supabase MCP сервера с project_ref
- **disabled** - включен/выключен сервер (false = включен)
- **autoApprove** - список инструментов для автоматического одобрения

### 3. Перезапуск MCP сервера

MCP сервер автоматически переподключится при изменении конфигурации.  
Или можно переподключить вручную:
- Command Palette → "MCP: Reconnect Server"
- Или в панели "MCP Server" → кнопка переподключения

## Доступные инструменты

После подключения Supabase MCP предоставляет следующие инструменты:

### Просмотр схемы
- `supabase_list_tables` - список всех таблиц
- `supabase_describe_table` - описание структуры таблицы
- `supabase_list_columns` - список колонок таблицы

### Работа с данными
- `supabase_query` - выполнение SQL запросов
- `supabase_insert` - вставка данных
- `supabase_update` - обновление данных
- `supabase_delete` - удаление данных

### Управление схемой
- `supabase_create_table` - создание таблицы
- `supabase_alter_table` - изменение таблицы
- `supabase_drop_table` - удаление таблицы

## Использование

### Пример 1: Просмотр таблиц

Просто спросите AI:
```
Покажи все таблицы в Supabase
```

AI использует `supabase_list_tables` и покажет список.

### Пример 2: Просмотр данных

```
Покажи всех пользователей из таблицы profiles
```

AI выполнит SQL запрос через `supabase_query`.

### Пример 3: Создание таблицы

```
Создай таблицу notifications с полями:
- id (uuid, primary key)
- user_id (uuid, foreign key to profiles)
- message (text)
- read (boolean, default false)
- created_at (timestamp)
```

AI использует `supabase_create_table`.

### Пример 4: Настройка RLS

```
Настрой RLS политики для таблицы posts:
- Все могут читать
- Только автор может редактировать
- Только автор может удалять
```

AI выполнит SQL через `supabase_query`.

## Безопасность

### Автоматическое одобрение

Можно добавить инструменты в `autoApprove` для автоматического выполнения:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=jgttwzvrsqnhdysutacc",
      "disabled": false,
      "autoApprove": [
        "supabase_list_tables",
        "supabase_describe_table",
        "supabase_query"
      ]
    }
  }
}
```

⚠️ **Внимание:** Будьте осторожны с автоматическим одобрением операций изменения данных!

### Рекомендации

✅ Автоматически одобрять: чтение данных, просмотр схемы  
⚠️ Вручную одобрять: вставка, обновление, удаление данных  
❌ Не автоматически одобрять: удаление таблиц, изменение схемы  

## Примеры задач для AI


### Настройка RLS
```
Настрой RLS для всех таблиц согласно документации в docs/QUICK_START_SUPABASE_AUTH.md
```

### Анализ данных
```
Покажи статистику:
- Сколько пользователей зарегистрировано
- Сколько постов создано
- Сколько комментариев оставлено
```

### Создание схемы
```
Создай таблицу для хранения уведомлений с полями:
- id, user_id, message, read, created_at
Настрой foreign key и RLS
```

## Отключение MCP

Если нужно временно отключить:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=jgttwzvrsqnhdysutacc",
      "disabled": true,  // ← изменить на true
      "autoApprove": []
    }
  }
}
```

## Troubleshooting

### MCP сервер не подключается

1. Проверьте URL в конфигурации
2. Проверьте, что project_ref правильный
3. Перезапустите Kiro IDE
4. Проверьте логи в Command Palette → "MCP: Show Logs"

### Инструменты не работают

1. Проверьте, что сервер включен (disabled: false)
2. Проверьте права доступа в Supabase Dashboard
3. Проверьте, что API keys настроены в .env

### Ошибки выполнения

1. Проверьте SQL синтаксис
2. Проверьте права доступа (RLS)
3. Проверьте, что таблицы существуют

## Полезные ссылки

- [Supabase MCP Documentation](https://mcp.supabase.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Kiro MCP Guide](https://docs.kiro.ai/mcp)

## Следующие шаги

Теперь можно:
1. ✅ Попросить AI показать структуру базы данных
2. ✅ Настроить RLS через AI
3. ✅ Создать trigger для автоматического создания профилей

Просто спросите AI, и он использует Supabase MCP для выполнения задач!
