-- ============================================
-- Prepare safe backfill for legacy orphan profiles
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  candidate_username text;
  role_value text;
  attempt integer := 0;
  max_attempts integer := 10;
  violated_constraint_name text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id::text = new.id::text) THEN
    RETURN new;
  END IF;

  IF lower(
       COALESCE(
         new.raw_app_meta_data ->> 'legacy_profile_backfill',
         new.raw_user_meta_data ->> 'legacy_profile_backfill',
         'false'
       )
     ) = 'true'
     AND new.email IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.profiles
       WHERE lower(email) = lower(new.email)
     ) THEN
    RETURN new;
  END IF;

  base_username := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'username'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'name'), ''),
    NULLIF(split_part(COALESCE(new.email, ''), '@', 1), ''),
    'Пользователь'
  );
  role_value := COALESCE(NULLIF(new.raw_user_meta_data->>'role', ''), 'student');

  WHILE attempt < max_attempts LOOP
    candidate_username := CASE
      WHEN attempt = 0 THEN base_username
      ELSE base_username || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 6)
    END;

    BEGIN
      INSERT INTO public.profiles (id, username, email, role, created_at)
      VALUES (
        new.id,
        candidate_username,
        new.email,
        role_value,
        now()
      );

      RETURN new;
    EXCEPTION
      WHEN unique_violation THEN
        GET STACKED DIAGNOSTICS violated_constraint_name = CONSTRAINT_NAME;

        IF EXISTS (SELECT 1 FROM public.profiles WHERE id::text = new.id::text) THEN
          RETURN new;
        END IF;

        IF violated_constraint_name = 'unique_username' THEN
          attempt := attempt + 1;
        ELSE
          RAISE;
        END IF;
    END;
  END LOOP;

  RAISE EXCEPTION 'handle_new_user failed to create unique profile username for auth user %', new.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Автоматически создает профиль пользователя при регистрации через Supabase Auth, ретраит только unique_username и пропускает legacy email backfill.';

CREATE OR REPLACE FUNCTION public.reassign_profile_id(old_profile_id text, new_profile_id uuid)
RETURNS jsonb AS $$
DECLARE
  original_profile public.profiles%ROWTYPE;
  temp_username text;
  temp_email text;
  posts_updated integer := 0;
  comments_updated integer := 0;
  likes_updated integer := 0;
  views_updated integer := 0;
  comment_likes_updated integer := 0;
  profiles_deleted integer := 0;
BEGIN
  IF old_profile_id IS NULL OR trim(old_profile_id) = '' THEN
    RAISE EXCEPTION 'old_profile_id is required';
  END IF;

  IF new_profile_id IS NULL THEN
    RAISE EXCEPTION 'new_profile_id is required';
  END IF;

  SELECT *
  INTO original_profile
  FROM public.profiles
  WHERE id = old_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile % not found', old_profile_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new_profile_id::text) THEN
    RAISE EXCEPTION 'profile with id % already exists', new_profile_id;
  END IF;

  temp_username := '__legacy_backfill__' || old_profile_id;
  temp_email := CASE
    WHEN original_profile.email IS NULL OR trim(original_profile.email) = '' THEN NULL
    ELSE '__legacy_backfill__' || old_profile_id || '@invalid.local'
  END;

  UPDATE public.profiles
  SET
    username = temp_username,
    email = temp_email,
    updated_at = now()
  WHERE id = old_profile_id;

  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    username,
    email,
    updated_at,
    bio,
    location,
    website,
    social,
    avatar_url,
    preferred_category,
    preferred_view_mode,
    preferred_theme,
    role,
    created_at
  )
  VALUES (
    new_profile_id::text,
    original_profile.first_name,
    original_profile.last_name,
    original_profile.username,
    original_profile.email,
    now(),
    original_profile.bio,
    original_profile.location,
    original_profile.website,
    original_profile.social,
    original_profile.avatar_url,
    original_profile.preferred_category,
    original_profile.preferred_view_mode,
    original_profile.preferred_theme,
    original_profile.role,
    original_profile.created_at
  );

  UPDATE public.posts
  SET author_id = new_profile_id::text
  WHERE author_id = old_profile_id;
  GET DIAGNOSTICS posts_updated = ROW_COUNT;

  UPDATE public.comments
  SET author_id = new_profile_id::text
  WHERE author_id = old_profile_id;
  GET DIAGNOSTICS comments_updated = ROW_COUNT;

  UPDATE public.likes
  SET user_id = new_profile_id::text
  WHERE user_id = old_profile_id;
  GET DIAGNOSTICS likes_updated = ROW_COUNT;

  UPDATE public.views
  SET user_id = new_profile_id::text
  WHERE user_id = old_profile_id;
  GET DIAGNOSTICS views_updated = ROW_COUNT;

  UPDATE public.comment_likes
  SET user_id = new_profile_id::text
  WHERE user_id = old_profile_id;
  GET DIAGNOSTICS comment_likes_updated = ROW_COUNT;

  DELETE FROM public.profiles
  WHERE id = old_profile_id;
  GET DIAGNOSTICS profiles_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'old_profile_id', old_profile_id,
    'new_profile_id', new_profile_id::text,
    'posts_updated', posts_updated,
    'comments_updated', comments_updated,
    'likes_updated', likes_updated,
    'views_updated', views_updated,
    'comment_likes_updated', comment_likes_updated,
    'profiles_deleted', profiles_deleted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reassign_profile_id(text, uuid) IS
  'Создает новую профильную запись под auth.users.id, переносит все внешние ссылки и удаляет legacy profile запись.';
