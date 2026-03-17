-- ============================================
-- Fix OAuth/profile trigger for duplicate usernames
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
  'Автоматически создает профиль пользователя при регистрации через Supabase Auth и безопасно переживает коллизии username';
