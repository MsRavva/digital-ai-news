import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clearReturnUrl, getReturnUrl } from "@/lib/auth-helpers";

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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
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
        const username =
          data.user.user_metadata?.username ||
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "Пользователь";

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

  let redirectUrl = getReturnUrl() || "/";

  // Sanitize redirectUrl
  if (
    ["/login", "/register", "/forgot-password", "/reset-password"].some((path) =>
      redirectUrl.includes(path)
    )
  ) {
    redirectUrl = "/";
  }
  clearReturnUrl();

  return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
}
