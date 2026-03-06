import { randomBytes } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSafePostAuthRedirect } from "@/lib/oauth-redirect";

function generateRandomSuffix(): string {
  return randomBytes(4).toString("hex").slice(0, 6);
}

async function generateUniqueUsername(
  supabase: ReturnType<typeof createServerClient>,
  baseUsername: string
): Promise<string | null> {
  const MAX_RETRIES = 3;
  let username = baseUsername;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      username = `${baseUsername}_${generateRandomSuffix()}`;
    }

    const { error } = await supabase.from("profiles").insert({
      id: crypto.randomUUID(),
      username,
      email: null,
      role: "student",
    });

    if (!error) {
      await supabase.from("profiles").delete().eq("username", username);
      return username;
    }

    const errorCode = error.code;
    const errorMessage = (error.message || "").toLowerCase();
    const isDuplicateError =
      errorCode === "23505" ||
      errorMessage.includes("duplicate") ||
      errorMessage.includes("unique") ||
      errorMessage.includes("already exists");

    if (!isDuplicateError) {
      console.error("Unexpected error checking username:", error);
      return null;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> =
    [];

  const applyCookies = (response: NextResponse) => {
    const uniqueCookies = new Map<
      string,
      { name: string; value: string; options?: Record<string, unknown> }
    >();
    for (const cookie of cookiesToSet) {
      uniqueCookies.set(cookie.name, cookie);
    }

    for (const { name, value, options } of uniqueCookies.values()) {
      response.cookies.set(name, value, options);
    }
  };

  const createRedirectResponse = (path: string) => {
    const response = NextResponse.redirect(new URL(path, requestUrl.origin));
    applyCookies(response);
    return response;
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(nextCookiesToSet) {
          cookiesToSet.push(...nextCookiesToSet);
        },
      },
    }
  );

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return createRedirectResponse(
        `/login?error=auth_failed&details=${encodeURIComponent(error.message)}`
      );
    }

    if (data.session && data.user) {
      // Проверяем и создаем профиль, если его нет (для OAuth пользователей)
      // Триггер должен создать профиль автоматически, но на случай задержки проверяем
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[OAuth Callback] Profile check error:", profileError.message);
      }

      if (!existingProfile && !profileError) {
        // Профиль не существует, создаем вручную
        // Для OAuth пользователей используем email как username, если нет метаданных
        const baseUsername =
          data.user.user_metadata?.username ||
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "Пользователь";

        // Генерируем уникальный username с retry logic
        const username = await generateUniqueUsername(supabase, baseUsername);

        if (!username) {
          console.error("Failed to generate unique username for user:", data.user.id);
          return createRedirectResponse("/login?error=profile_creation_failed");
        }

        const { error: createError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username,
          email: data.user.email || null,
          role: data.user.user_metadata?.role || "student",
        });

        if (createError) {
          // Игнорируем ошибки дубликатов (профиль мог быть создан между проверкой и вставкой)
          const errorCode = createError.code;
          const errorMessage = (createError.message || "").toLowerCase();
          const isDuplicateError =
            errorCode === "23505" ||
            errorCode === "PGRST301" ||
            errorMessage.includes("duplicate") ||
            errorMessage.includes("unique") ||
            errorMessage.includes("already exists");

          if (!isDuplicateError) {
            console.error("Error creating profile:", createError);
          }
        }
      }
    }
  }

  const nextRedirect = getSafePostAuthRedirect(requestUrl.searchParams.get("next"));
  if (nextRedirect) {
    return createRedirectResponse(nextRedirect);
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererPath = new URL(referer).pathname;
      const refererRedirect = getSafePostAuthRedirect(refererPath);
      if (refererRedirect) {
        return createRedirectResponse(refererRedirect);
      }
    } catch {
      // Ignore invalid referer and fallback to home page.
    }
  }

  return createRedirectResponse("/");
}
