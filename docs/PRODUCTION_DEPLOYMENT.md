# Развертывание на продакшене

## Предварительные требования

- ✅ Все тесты пройдены (см. `TESTING_CHECKLIST.md`)
- ✅ OAuth провайдеры настроены
- ✅ Данные мигрированы (если применимо)
- ✅ Приложение работает локально без ошибок

## 1. Настройка Appwrite для продакшена

### 1.1. Проверка настроек безопасности

В Appwrite Console:

- [ ] Убедитесь, что `APPWRITE_API_KEY` хранится только на сервере и не попадает в клиентский bundle
- [ ] Проверьте права API key на Auth и TablesDB
- [ ] Проверьте permissions для таблиц и строк в TablesDB

### 1.2. Настройка Email

В Appwrite Console → Auth → Settings:

- [ ] Проверьте Email/password auth
- [ ] Включите email confirmation для новых пользователей, если это требуется продуктом
- [ ] Настройте email templates (опционально)
- [ ] Добавьте свой SMTP сервер (рекомендуется)

### 1.3. Настройка OAuth

#### Google OAuth
1. В Google Cloud Console добавьте Authorized redirect URI Appwrite:
   ```
   https://<region>.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/<project-id>
   ```

2. В Appwrite Console → Auth → Settings → OAuth2 Providers → Google:
   - Проверьте Client ID и Client Secret
   - Проверьте, что Google provider включен
   - Не подменяйте Appwrite callback на домен Next.js-приложения

#### GitHub OAuth
1. В GitHub OAuth Apps добавьте Authorization callback URL Appwrite:
   ```
   https://<region>.cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/<project-id>
   ```

2. В Appwrite Console → Auth → Settings → OAuth2 Providers → GitHub:
   - Проверьте Client ID и Client Secret
   - Проверьте, что GitHub provider включен

### 1.4. Настройка Rate Limiting

В Appwrite Console и на уровне хостинга приложения:

- [ ] Настройте rate limiting для API
- [ ] Настройте rate limiting для Auth

## 2. Настройка Next.js для продакшена

### 2.1. Переменные окружения

Создайте `.env.production` или настройте переменные в вашем хостинге:

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

# Next.js
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_AUTH_CALLBACK_URL=https://your-domain.com
```

### 2.2. Оптимизация

В `next.config.js` (или `next.config.ts`):

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимизация изображений
  images: {
    domains: ['your-project.supabase.co'],
  },
  
  // Сжатие
  compress: true,
  
  // Оптимизация бандла
  swcMinify: true,
  
  // Строгий режим
  reactStrictMode: true,
}

export default nextConfig
```

### 2.3. Сборка

```bash
# Проверка перед сборкой без Markdown
bunx biome check --write app components context lib scripts types
bunx tsc --noEmit

# Сборка
bun run build

# Тест продакшен версии локально
bun run start
```

## 3. Развертывание

### Vercel (рекомендуется для Next.js)

1. Установите Vercel CLI:
```bash
bun add -g vercel
```

2. Войдите в Vercel:
```bash
vercel login
```

3. Разверните проект:
```bash
vercel --prod
```

4. Настройте переменные окружения в Vercel Dashboard:
   - Settings → Environment Variables
   - Добавьте все переменные из `.env.production`

5. Настройте домен:
   - Settings → Domains
   - Добавьте свой домен

### Netlify

1. Установите Netlify CLI:
```bash
bun add -g netlify-cli
```

2. Войдите в Netlify:
```bash
netlify login
```

3. Разверните проект:
```bash
netlify deploy --prod
```

4. Настройте переменные окружения в Netlify Dashboard

### Docker (для самостоятельного хостинга)

1. Создайте `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
```

2. Создайте `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_APPWRITE_ENDPOINT=${NEXT_PUBLIC_APPWRITE_ENDPOINT}
      - NEXT_PUBLIC_APPWRITE_PROJECT_ID=${NEXT_PUBLIC_APPWRITE_PROJECT_ID}
      - APPWRITE_ENDPOINT=${APPWRITE_ENDPOINT}
      - APPWRITE_PROJECT_ID=${APPWRITE_PROJECT_ID}
      - APPWRITE_API_KEY=${APPWRITE_API_KEY}
      - APPWRITE_DATABASE_ID=${APPWRITE_DATABASE_ID}
    restart: unless-stopped
```

3. Разверните:
```bash
docker-compose up -d
```

## 4. Мониторинг

### 4.1. Appwrite Monitoring

В Appwrite Console:

- [ ] Настройте алерты для ошибок
- [ ] Мониторьте использование Auth и TablesDB
- [ ] Проверяйте логи функций, сайтов и API регулярно

### 4.2. Application Monitoring

Рекомендуемые инструменты:

- **Sentry** - отслеживание ошибок
- **Vercel Analytics** - аналитика производительности
- **Google Analytics** - аналитика пользователей

Установка Sentry:

```bash
bun add @sentry/nextjs
```

Настройка в `sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

## 5. Безопасность

### 5.1. Проверка безопасности

- [ ] Все секретные ключи в переменных окружения
- [ ] Permissions настроены для Appwrite TablesDB
- [ ] CORS настроен правильно
- [ ] Rate limiting включен
- [ ] HTTPS включен

### 5.2. Регулярные обновления

```bash
# Проверка уязвимостей
bun audit

# Обновление зависимостей
bun update

# Проверка устаревших пакетов
bun outdated
```

## 6. Резервное копирование

### 6.1. База данных

В Appwrite Console и/или внешней резервной инфраструктуре:

- [ ] Включите автоматические бэкапы
- [ ] Настройте расписание
- [ ] Проверьте восстановление из бэкапа

### 6.2. Код

- [ ] Используйте Git для версионирования
- [ ] Создайте теги для релизов
- [ ] Храните копии в нескольких местах

## 7. Производительность

### 7.1. Оптимизация базы данных

```sql
-- Создайте индексы для часто используемых запросов
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
```

### 7.2. Кэширование

В `next.config.js`:

```typescript
const nextConfig = {
  // Кэширование статических ресурсов
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

## 8. Чеклист перед запуском

### Код
- [ ] Все тесты пройдены
- [ ] Нет console.log в продакшене
- [ ] Нет TODO/FIXME в критичных местах
- [ ] Код отформатирован и проверен линтером

### Конфигурация
- [ ] Переменные окружения настроены
- [ ] OAuth провайдеры настроены
- [ ] Email настроен
- [ ] Rate limiting включен

### База данных
- [ ] Appwrite permissions включены и проверены
- [ ] Политики проверены
- [ ] Индексы созданы
- [ ] Бэкапы настроены

### Безопасность
- [ ] HTTPS включен
- [ ] Секретные ключи защищены
- [ ] CORS настроен
- [ ] Мониторинг настроен

### Производительность
- [ ] Бандл оптимизирован
- [ ] Изображения оптимизированы
- [ ] Кэширование настроено
- [ ] CDN настроен (опционально)

## 9. После запуска

### Первые 24 часа
- [ ] Мониторьте логи на наличие ошибок
- [ ] Проверьте производительность
- [ ] Проверьте, что OAuth работает
- [ ] Проверьте, что email отправляются

### Первая неделя
- [ ] Соберите обратную связь от пользователей
- [ ] Проверьте метрики производительности
- [ ] Оптимизируйте узкие места
- [ ] Обновите документацию

### Регулярно
- [ ] Проверяйте логи ошибок
- [ ] Обновляйте зависимости
- [ ] Проверяйте безопасность
- [ ] Оптимизируйте производительность

## 10. Откат (Rollback)

Если что-то пошло не так:

### Vercel
```bash
# Откат к предыдущей версии
vercel rollback
```

### Docker
```bash
# Откат к предыдущему образу
docker-compose down
docker-compose up -d --build <previous-tag>
```

### База данных
```sql
-- Восстановление из Appwrite backup/export
-- Database → Backups → Restore
```

## Готово! 🚀

Ваше приложение готово к продакшену. Удачи!

---

**Важно:** Всегда тестируйте на staging окружении перед развертыванием на продакшене.
