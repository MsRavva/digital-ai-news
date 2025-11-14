# Быстрый старт после миграции

## 1. Настройка переменных окружения

Создайте файл `.env.local` (если его нет) и добавьте:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Получить ключи можно в Supabase Dashboard → Settings → API

## 2. Настройка OAuth провайдеров

### Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте OAuth 2.0 Client ID
3. Добавьте Authorized redirect URI:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
4. Скопируйте Client ID и Client Secret
5. В Supabase Dashboard → Authentication → Providers → Google:
   - Включите Google provider
   - Вставьте Client ID и Client Secret

### GitHub OAuth

1. Перейдите в [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Создайте New OAuth App
3. Добавьте Authorization callback URL:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
4. Скопируйте Client ID и Client Secret
5. В Supabase Dashboard → Authentication → Providers → GitHub:
   - Включите GitHub provider
   - Вставьте Client ID и Client Secret

## 3. Установка зависимостей

```bash
npm install
```

## 4. Запуск приложения

```bash
npm run dev
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
- Проверьте, что redirect URL правильно настроен в Google/GitHub
- Проверьте, что провайдеры включены в Supabase Dashboard
- Проверьте логи в Supabase Dashboard → Logs

### Ошибка "Email not confirmed"
- Проверьте настройки Email в Supabase Dashboard → Authentication → Email Auth
- Отключите "Confirm email" для тестирования (не рекомендуется для продакшена)

### Ошибка при создании профиля
- Проверьте, что trigger `handle_new_user` создан в Supabase
- Проверьте логи в Supabase Dashboard → Database → Functions

## Полезные команды

```bash
# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Запуск продакшен версии
npm run start

# Проверка кода
npm run lint

# Форматирование кода
npm run format
```

## Дополнительная информация

- Быстрый старт с Supabase Auth: `docs/QUICK_START_SUPABASE_AUTH.md`
