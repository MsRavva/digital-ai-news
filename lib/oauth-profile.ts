import { randomBytes } from "node:crypto";
import type { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

const USERNAME_MAX_ATTEMPTS = 5;
const PROFILE_CONFIRMATION_DELAYS_MS = [0, 250, 750];

type ServerSupabaseClient = ReturnType<typeof createServerClient>;

interface ProfileRecord {
  id: string;
  username: string;
  email: string | null;
  role: "student" | "teacher" | "admin";
}

export interface EnsureOAuthProfileResult {
  ok: boolean;
  outcome: "existing" | "updated" | "created" | "recovered_after_duplicate" | "failed";
  diagnostics: string[];
  profile: ProfileRecord | null;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateRandomSuffix(): string {
  return randomBytes(4).toString("hex").slice(0, 6);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getBaseUsername(user: User): string {
  const metadataUsername =
    typeof user.user_metadata?.username === "string" ? user.user_metadata.username : null;
  const metadataFullName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const metadataName =
    typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;
  const emailPrefix = user.email?.split("@")[0] ?? null;

  return normalizeWhitespace(
    metadataUsername || metadataFullName || metadataName || emailPrefix || "Пользователь"
  );
}

function isDuplicateError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;

  const errorMessage = (error.message || "").toLowerCase();

  return (
    error.code === "23505" ||
    error.code === "PGRST301" ||
    errorMessage.includes("duplicate") ||
    errorMessage.includes("unique") ||
    errorMessage.includes("already exists")
  );
}

async function getProfileById(
  supabase: ServerSupabaseClient,
  userId: string
): Promise<{ profile: ProfileRecord | null; error: { code?: string; message?: string } | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, email, role")
    .eq("id", userId)
    .maybeSingle();

  return {
    profile: (data as ProfileRecord | null) ?? null,
    error: error ? { code: error.code, message: error.message } : null,
  };
}

async function confirmProfile(
  supabase: ServerSupabaseClient,
  userId: string,
  diagnostics: string[]
): Promise<ProfileRecord | null> {
  for (const delayMs of PROFILE_CONFIRMATION_DELAYS_MS) {
    if (delayMs > 0) {
      diagnostics.push(`[confirm] ждем ${delayMs}мс перед повторной проверкой профиля`);
      await wait(delayMs);
    }

    const { profile, error } = await getProfileById(supabase, userId);

    if (error) {
      diagnostics.push(
        `[confirm] select profiles по id вернул ошибку: ${error.code || "no_code"} ${error.message || "unknown"}`
      );
      continue;
    }

    if (profile) {
      diagnostics.push(`[confirm] профиль подтвержден: username="${profile.username}"`);
      return profile;
    }

    diagnostics.push("[confirm] профиль пока не найден");
  }

  return null;
}

async function findAvailableUsername(
  supabase: ServerSupabaseClient,
  baseUsername: string,
  userId: string,
  diagnostics: string[]
): Promise<string | null> {
  const normalizedBase = normalizeWhitespace(baseUsername) || "Пользователь";

  for (let attempt = 0; attempt < USERNAME_MAX_ATTEMPTS; attempt++) {
    const candidate =
      attempt === 0 ? normalizedBase : `${normalizedBase}_${generateRandomSuffix()}`;

    diagnostics.push(`[username] проверяем кандидат "${candidate}"`);

    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();

    if (error) {
      diagnostics.push(
        `[username] select по username вернул ошибку: ${error.code || "no_code"} ${error.message || "unknown"}`
      );
      return null;
    }

    if (!data || data.id === userId) {
      diagnostics.push(`[username] кандидат "${candidate}" доступен`);
      return candidate;
    }

    diagnostics.push(`[username] кандидат "${candidate}" занят другим пользователем`);
  }

  diagnostics.push(
    "[username] не удалось подобрать свободный username за допустимое число попыток"
  );
  return null;
}

export async function ensureOAuthProfile(
  supabase: ServerSupabaseClient,
  user: User
): Promise<EnsureOAuthProfileResult> {
  const diagnostics: string[] = [`[profile] старт проверки профиля для user.id=${user.id}`];

  const initialCheck = await getProfileById(supabase, user.id);

  if (initialCheck.error) {
    diagnostics.push(
      `[profile] первичная проверка profiles завершилась ошибкой: ${initialCheck.error.code || "no_code"} ${initialCheck.error.message || "unknown"}`
    );
    return {
      ok: false,
      outcome: "failed",
      diagnostics,
      profile: null,
    };
  }

  if (initialCheck.profile) {
    diagnostics.push(
      `[profile] профиль уже существует: username="${initialCheck.profile.username}", email="${initialCheck.profile.email || "null"}"`
    );

    if (user.email && initialCheck.profile.email !== user.email) {
      diagnostics.push("[profile] email отличается, пробуем аккуратно обновить запись профиля");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          email: user.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        diagnostics.push(
          `[profile] update email не удался: ${updateError.code || "no_code"} ${updateError.message || "unknown"}`
        );
      } else {
        const confirmedProfile = await confirmProfile(supabase, user.id, diagnostics);

        return {
          ok: !!confirmedProfile,
          outcome: confirmedProfile ? "updated" : "failed",
          diagnostics,
          profile: confirmedProfile,
        };
      }
    }

    return {
      ok: true,
      outcome: "existing",
      diagnostics,
      profile: initialCheck.profile,
    };
  }

  diagnostics.push("[profile] профиль отсутствует, пробуем создать или восстановить его");

  for (let attempt = 0; attempt < USERNAME_MAX_ATTEMPTS; attempt++) {
    const username = await findAvailableUsername(
      supabase,
      getBaseUsername(user),
      user.id,
      diagnostics
    );

    if (!username) {
      return {
        ok: false,
        outcome: "failed",
        diagnostics,
        profile: null,
      };
    }

    diagnostics.push(`[profile] upsert профиля, попытка ${attempt + 1}, username="${username}"`);

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        username,
        email: user.email || null,
        role: "student",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      }
    );

    if (!upsertError) {
      const confirmedProfile = await confirmProfile(supabase, user.id, diagnostics);

      return {
        ok: !!confirmedProfile,
        outcome: confirmedProfile ? "created" : "failed",
        diagnostics,
        profile: confirmedProfile,
      };
    }

    diagnostics.push(
      `[profile] upsert завершился ошибкой: ${upsertError.code || "no_code"} ${upsertError.message || "unknown"}`
    );

    if (isDuplicateError(upsertError)) {
      const confirmedProfile = await confirmProfile(supabase, user.id, diagnostics);

      if (confirmedProfile) {
        diagnostics.push(
          "[profile] после duplicate-конфликта профиль уже существует, продолжаем flow"
        );

        return {
          ok: true,
          outcome: "recovered_after_duplicate",
          diagnostics,
          profile: confirmedProfile,
        };
      }

      diagnostics.push(
        "[profile] duplicate-конфликт не подтвердил профиль, пробуем новый username"
      );
      continue;
    }

    return {
      ok: false,
      outcome: "failed",
      diagnostics,
      profile: null,
    };
  }

  diagnostics.push("[profile] исчерпаны попытки upsert профиля");

  return {
    ok: false,
    outcome: "failed",
    diagnostics,
    profile: null,
  };
}
