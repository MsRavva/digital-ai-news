# Быстрый старт после миграции на Appwrite

## 1. Настройка переменных окружения

Создайте файл `.env.local` или используйте локальный `.env` и добавьте Appwrite-переменные:

```env
# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://<region>.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<project-id>
APPWRITE_ENDPOINT=https://<region>.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<project-id>
APPWRITE_API_KEY=<server-api-key>
APPWRITE_DATABASE_ID=<database-id>
APPWRITE_PROFILES_TABLE_ID=profiles
APPWRITE_POSTS_TABLE_ID=posts
APPWRITE_TAGS_TABLE_ID=tags
APPWRITE_POST_TAGS_TABLE_ID=post_tags
APPWRITE_COMMENTS_TABLE_ID=comments
APPWRITE_LIKES_TABLE_ID=likes
APPWRITE_COMMENT_LIKES_TABLE_ID=comment_likes
APPWRITE_VIEWS_TABLE_ID=views
```

Endpoint, Project ID, API key и OAuth-настройки берутся из Appwrite Console.

## 2. Настройка OAuth провайдеров

### Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте OAuth 2.0 Client ID
3. Добавьте Authorized redirect URI в точности в таком формате:
   ```
   https://<region>.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/<project-id>
   ```
4. Скопируйте Client ID и Client Secret
5. В Appwrite Console → Auth → Settings → OAuth2 Providers → Google:
   - Включите Google provider
   - Вставьте Client ID и Client Secret

### GitHub OAuth

1. Перейдите в [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Создайте New OAuth App
3. Добавьте Authorization callback URL в точности в таком формате:
   ```
   https://<region>.cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/<project-id>
   ```
4. Скопируйте Client ID и Client Secret
5. В Appwrite Console → Auth → Settings → OAuth2 Providers → GitHub:
   - Включите GitHub provider
   - Вставьте Client ID и Client Secret

## 3. Установка зависимостей

```bash
bun install
```

## 4. Запуск приложения

```bash
bun run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## 5. Тестирование

### Регистрация нового пользователя
1. Перейдите на http://localhost:3000/register
2. Заполните форму:
   - Email: test@example.com
   - Имя пользователя: Иван Иванов (обязательно на русском)
   - Пароль: минимум 6 символов
3. Нажмите "Зарегистрироваться"

### Вход через OAuth
1. Перейдите на http://localhost:3000/login
2. Нажмите "Продолжить с Google" или "Продолжить с GitHub"
3. Авторизуйтесь через выбранный провайдер
4. Если имя пользователя не соответствует формату "Имя Фамилия", вы будете перенаправлены на страницу профиля

## 6. Возможные проблемы

### OAuth не работает
- Проверьте, что redirect URL в Google/GitHub совпадает с Appwrite callback без лишних слешей, другого региона или другого project id.
- Для Google ошибка `redirect_uri_mismatch` означает, что в Google Cloud Console отсутствует URI вида `https://<region>.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/<project-id>`.
- Проверьте, что провайдеры включены в Appwrite Console → Auth → Settings → OAuth2 Providers.

### Ошибка "Email not confirmed"
- Проверьте настройки Email/password auth в Appwrite Console → Auth → Settings
- Отключите "Confirm email" для тестирования (не рекомендуется для продакшена)

### Ошибка при создании профиля
- Проверьте, что Appwrite TablesDB schema создана через `scripts/setup-appwrite-schema.ts`.
- Проверьте, что `APPWRITE_API_KEY` имеет права на Auth и TablesDB.

## Полезные команды

```bash
# Запуск в режиме разработки
bun run dev

# Сборка для продакшена
bun run build

# Запуск продакшен версии
bun run start

# Проверка кода без Markdown
bunx biome check --write app components context lib scripts types

# TypeScript
bunx tsc --noEmit
```

## Дополнительная информация

- Целевая схема Appwrite: `docs/APPWRITE_TECHNICAL_BLUEPRINT.md`
