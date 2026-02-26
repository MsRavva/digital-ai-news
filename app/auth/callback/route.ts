import { randomBytes } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

  if (code) {
    const cookieStore = await cookies();

    // Создаем серверный Supabase клиент с cookie support
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options);
              }
            } catch {
              // Игнорируем ошибки cookie в middleware
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error.message, error);
      return NextResponse.redirect(
        new URL(
          `/login?error=auth_failed&details=${encodeURIComponent(error.message)}`,
          requestUrl.origin
        )
      );
    }

    if (data.session && data.user) {
      console.log("Session created successfully for user:", data.user.email);

      // Проверяем и создаем профиль, если его нет (для OAuth пользователей)
      // Триггер должен создать профиль автоматически, но на случай задержки проверяем
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

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
          return NextResponse.redirect(
            new URL("/login?error=profile_creation_failed", requestUrl.origin)
          );
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

  const nextPath = requestUrl.searchParams.get("next");
  let redirectUrl: string;

  // Безопасная валидация redirect URL - только относительные пути
  // Защита от Open Redirect: запрещаем абсолютные URL и protocol-relative URL
  if (
    nextPath?.startsWith("/") &&
    !nextPath.startsWith("//") &&
    !nextPath.startsWith("/\\") &&
    !/^\/\w+:\/\//i.test(nextPath)
  ) {
    // Дополнительная проверка - не разрешаем редирект на auth страницы
    const forbiddenPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
    const isForbidden = forbiddenPaths.some(
      (path) => nextPath === path || nextPath.startsWith(`${path}/`)
    );

    redirectUrl = isForbidden ? "/" : nextPath;
  } else {
    // Если nextPath не передан, проверяем есть ли параметр referer
    // Из страницы откуда пришл от OAuth
    const referer = request.headers.get("referer");
    if (referer) {
      const refererUrl = new URL(referer);
      const refererPath = refererUrl.pathname;

      // Если referer - это страница login/register, редиректируем на главную
      const authPaths = ["/login", "/register"];
      const isAuthPage = authPaths.some(
        (path) => refererPath === path || refererPath.startsWith(`${path}/`)
      );

      redirectUrl = isAuthPage ? "/" : refererPath;
    } else {
      redirectUrl = "/";
    }
  }

  return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
}
