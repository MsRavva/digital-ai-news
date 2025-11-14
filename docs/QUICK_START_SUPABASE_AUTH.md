# Быстрый старт: Включение Supabase Auth

## Проблема
Страница `/register` для регистрации новых пользователей.

## Быстрое решение (5 минут)

### 1. Настройте Supabase Auth

Зайдите в [Supabase Dashboard](https://supabase.com/dashboard/project/jgttwzvrsqnhdysutacc/auth/providers):

**Authentication → Providers:**

1. **Email** - включите (уже должен быть включен)
   - Confirm email: можно отключить для тестирования
   
2. **Google OAuth** (опционально):
   - Получите credentials: https://console.cloud.google.com/apis/credentials
   - Authorized redirect URI: `https://jgttwzvrsqnhdysutacc.supabase.co/auth/v1/callback`
   
3. **GitHub OAuth** (опционально):
   - Создайте OAuth App: https://github.com/settings/developers
   - Authorization callback URL: `https://jgttwzvrsqnhdysutacc.supabase.co/auth/v1/callback`

### 2. Создайте trigger для автоматического создания профилей

Зайдите в **SQL Editor** и выполните:

```sql
-- Функция для создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger для автоматического создания профиля
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Настройте RLS (Row Level Security)

```sql
-- Включаем RLS для таблицы profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Пользователи могут читать все профили
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Пользователи могут вставлять только свой профиль
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Аналогично для posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT
USING (true);

CREATE POLICY "Users can create posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (auth.uid() = author_id);

-- Аналогично для comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Comments are viewable by everyone"
ON comments FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (auth.uid() = author_id);

-- Для likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

CREATE POLICY "Likes are viewable by everyone"
ON likes FOR SELECT
USING (true);

CREATE POLICY "Users can create likes"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);
```

### 4. Обновите код приложения

Замените в `context/auth-context.tsx`:

```typescript
import {
  signIn,
  signUp,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  subscribeToAuthChanges,
} from "@/lib/supabase-auth"
```

И обновите типы:
```typescript
import type { User } from "@supabase/supabase-js"
```

### 5. Обновите страницы login и register

В `app/login/page.tsx` и `app/register/page.tsx` используйте:

```typescript
import { getSupabaseErrorMessage } from "@/lib/supabase-error-handler"
```

## Готово!

Теперь:
- ✅ Страница `/register` доступна
- ✅ Можно создавать новых пользователей
- ✅ Работает вход через email/password
- ✅ Работает OAuth (Google, GitHub)
- ✅ Профили создаются автоматически
- ✅ RLS защищает данные

## Тестирование

1. Перезапустите dev сервер: `pnpm dev`
2. Откройте `/register`
3. Создайте тестового пользователя
4. Проверьте, что профиль создался в Supabase Dashboard → Table Editor → profiles

## Что дальше?

После успешного тестирования приложение готово к использованию!
