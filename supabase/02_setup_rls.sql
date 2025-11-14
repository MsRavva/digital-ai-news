-- ============================================
-- RLS (Row Level Security) для таблицы profiles
-- ============================================

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

-- ============================================
-- RLS для таблицы posts
-- ============================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Admins can update any post" ON posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON posts;

-- Все могут читать посты
CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT
USING (true);

-- Авторизованные пользователи могут создавать посты
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Пользователи могут обновлять свои посты
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (auth.uid() = author_id);

-- Пользователи могут удалять свои посты
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (auth.uid() = author_id);

-- Админы и учителя могут обновлять любые посты
CREATE POLICY "Admins can update any post"
ON posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- Админы и учителя могут удалять любые посты
CREATE POLICY "Admins can delete any post"
ON posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- ============================================
-- RLS для таблицы comments
-- ============================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Admins can delete any comment" ON comments;

-- Все могут читать комментарии
CREATE POLICY "Comments are viewable by everyone"
ON comments FOR SELECT
USING (true);

-- Авторизованные пользователи могут создавать комментарии
CREATE POLICY "Users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Пользователи могут удалять свои комментарии
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
USING (auth.uid() = author_id);

-- Админы и учителя могут удалять любые комментарии
CREATE POLICY "Admins can delete any comment"
ON comments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- ============================================
-- RLS для таблицы likes
-- ============================================

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

-- Все могут читать лайки
CREATE POLICY "Likes are viewable by everyone"
ON likes FOR SELECT
USING (true);

-- Пользователи могут создавать лайки
CREATE POLICY "Users can create likes"
ON likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять свои лайки
CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS для таблицы comment_likes
-- ============================================

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON comment_likes;
DROP POLICY IF EXISTS "Users can create comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can delete own comment likes" ON comment_likes;

-- Все могут читать лайки комментариев
CREATE POLICY "Comment likes are viewable by everyone"
ON comment_likes FOR SELECT
USING (true);

-- Пользователи могут создавать лайки комментариев
CREATE POLICY "Users can create comment likes"
ON comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Пользователи могут удалять свои лайки комментариев
CREATE POLICY "Users can delete own comment likes"
ON comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS для таблицы views
-- ============================================

ALTER TABLE views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Views are viewable by everyone" ON views;
DROP POLICY IF EXISTS "Anyone can create views" ON views;

-- Все могут читать просмотры
CREATE POLICY "Views are viewable by everyone"
ON views FOR SELECT
USING (true);

-- Любой может создавать просмотры (даже неавторизованные)
CREATE POLICY "Anyone can create views"
ON views FOR INSERT
WITH CHECK (true);

-- ============================================
-- RLS для таблицы tags
-- ============================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tags are viewable by everyone" ON tags;
DROP POLICY IF EXISTS "Admins can manage tags" ON tags;

-- Все могут читать теги
CREATE POLICY "Tags are viewable by everyone"
ON tags FOR SELECT
USING (true);

-- Только админы и учителя могут управлять тегами
CREATE POLICY "Admins can manage tags"
ON tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'teacher')
  )
);

-- ============================================
-- RLS для таблицы post_tags
-- ============================================

ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Post tags are viewable by everyone" ON post_tags;
DROP POLICY IF EXISTS "Post authors can manage their post tags" ON post_tags;

-- Все могут читать связи пост-тег
CREATE POLICY "Post tags are viewable by everyone"
ON post_tags FOR SELECT
USING (true);

-- Авторы постов могут управлять тегами своих постов
CREATE POLICY "Post authors can manage their post tags"
ON post_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_tags.post_id
    AND posts.author_id = auth.uid()
  )
);

-- Комментарии
COMMENT ON POLICY "Profiles are viewable by everyone" ON profiles IS 'Все пользователи могут просматривать профили';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Пользователи могут обновлять только свой профиль';
COMMENT ON POLICY "Posts are viewable by everyone" ON posts IS 'Все пользователи могут просматривать посты';
COMMENT ON POLICY "Users can create posts" ON posts IS 'Авторизованные пользователи могут создавать посты';
