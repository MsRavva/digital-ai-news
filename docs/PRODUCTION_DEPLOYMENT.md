# Развертывание на продакшене

## Предварительные требования

- ✅ Все тесты пройдены (см. `TESTING_CHECKLIST.md`)
- ✅ OAuth провайдеры настроены
- ✅ Данные мигрированы (если применимо)
- ✅ Приложение работает локально без ошибок

## 1. Настройка Supabase для продакшена

### 1.1. Проверка настроек безопасности

В Supabase Dashboard → Settings → API:

- [ ] Убедитесь, что `service_role` ключ не используется на клиенте
- [ ] Проверьте, что RLS включен для всех таблиц
- [ ] Проверьте политики доступа

### 1.2. Настройка Email

В Supabase Dashboard → Authentication → Email Auth:

- [ ] Включите "Confirm email" для новых пользователей
- [ ] Настройте email templates (опционально)
- [ ] Добавьте свой SMTP сервер (рекомендуется)

### 1.3. Настройка OAuth

#### Google OAuth
1. В Google Cloud Console добавьте продакшен URL:
   ```
   https://your-domain.com
   https://your-project.supabase.co/auth/v1/callback
   ```

2. В Supabase Dashboard → Authentication → Providers → Google:
   - Проверьте Client ID и Client Secret
   - Добавьте продакшен redirect URL

#### GitHub OAuth
1. В GitHub OAuth Apps добавьте продакшен URL:
   ```
   https://your-domain.com
   https://your-project.supabase.co/auth/v1/callback
   ```

2. В Supabase Dashboard → Authentication → Providers → GitHub:
   - Проверьте Client ID и Client Secret
   - Добавьте продакшен redirect URL

### 1.4. Настройка Rate Limiting

В Supabase Dashboard → Settings → API:

- [ ] Настройте rate limiting для API
- [ ] Настройте rate limiting для Auth

## 2. Настройка Next.js для продакшена

### 2.1. Переменные окружения

Создайте `.env.production` или настройте переменные в вашем хостинге:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Next.js
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
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
# Проверка перед сборкой
bun run lint
bun run format

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
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
```

3. Разверните:
```bash
docker-compose up -d
```

## 4. Мониторинг

### 4.1. Supabase Monitoring

В Supabase Dashboard → Reports:

- [ ] Настройте алерты для ошибок
- [ ] Мониторьте использование API
- [ ] Проверяйте логи регулярно

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
- [ ] RLS включен для всех таблиц
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

В Supabase Dashboard → Database → Backups:

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
- [ ] RLS включен
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
-- Восстановление из бэкапа в Supabase Dashboard
-- Database → Backups → Restore
```

## Готово! 🚀

Ваше приложение готово к продакшену. Удачи!

---

**Важно:** Всегда тестируйте на staging окружении перед развертыванием на продакшене.
