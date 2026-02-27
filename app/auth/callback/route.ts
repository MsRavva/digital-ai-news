import { randomBytes } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
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
  console.log("=== OAUTH CALLBACK START ===");
  console.log("[OAuth Callback] Request URL:", request.url);
  console.log("[OAuth Callback] Request method:", request.method);
  console.log("[OAuth Callback] Request headers:", JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
  
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  console.log("[OAuth Callback] Code present:", !!code);
  console.log("[OAuth Callback] Code value:", code?.substring(0, 10) + "...");
  console.log("[OAuth Callback] Next param:", requestUrl.searchParams.get("next"));
  console.log("[OAuth Callback] State param:", state);

  const cookiesToApply: Array<{
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }> = [];

  // Создаем серверный Supabase клиент с cookie support
  console.log("[OAuth Callback] Creating Supabase client...");
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          console.log("[OAuth Callback] Getting cookies:", cookies.length);
          return cookies;
        },
        setAll(cookiesToSet) {
          console.log("[OAuth Callback] Setting cookies:", cookiesToSet.length);
          // Сохраняем cookies для установки в финальный redirect response
          for (const { name, value, options } of cookiesToSet) {
            console.log("[OAuth Callback] Setting cookie:", name, value?.substring(0, 20) + "...");
            cookiesToApply.push({ name, value, options });
          }
        },
      },
    }
  );

  if (code) {
    console.log("[OAuth Callback] Exchanging code for session...");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[OAuth Callback] Error exchanging code:", error.message);
      console.error("[OAuth Callback] Error details:", JSON.stringify(error, null, 2));
      return NextResponse.redirect(
        new URL(
          `/login?error=auth_failed&details=${encodeURIComponent(error.message)}`,
          requestUrl.origin
        )
      );
    }

    console.log("[OAuth Callback] Session created:", !!data.session);
    console.log("[OAuth Callback] User:", data.user?.email);
    console.log("[OAuth Callback] User metadata:", JSON.stringify(data.user?.user_metadata, null, 2));

    if (data.session && data.user) {
      console.log("Session created successfully for user:", data.user.email);

      // Проверяем и создаем профиль, если его нет (для OAuth пользователей)
      // Триггер должен создать профиль автоматически, но на случай задержки проверяем
      console.log("[OAuth Callback] Checking if profile exists...");
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      console.log("[OAuth Callback] Profile check result:", existingProfile ? "found" : "not found");
      if (profileError) {
        console.error("[OAuth Callback] Profile check error:", profileError.message);
      }

      if (!existingProfile && !profileError) {
        console.log("[OAuth Callback] Creating profile...");
        // Профиль не существует, создаем вручную
        // Для OAuth пользователей используем email как username, если нет метаданных
        const baseUsername =
          data.user.user_metadata?.username ||
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "Пользователь";

        console.log("[OAuth Callback] Base username:", baseUsername);

        // Генерируем уникальный username с retry logic
        const username = await generateUniqueUsername(supabase, baseUsername);

        if (!username) {
          console.error("Failed to generate unique username for user:", data.user.id);
          return NextResponse.redirect(
            new URL("/login?error=profile_creation_failed", requestUrl.origin)
          );
        }

        console.log("[OAuth Callback] Generated username:", username);

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
          } else {
            console.log("[OAuth Callback] Profile creation skipped - duplicate");
          }
        } else {
          console.log("[OAuth Callback] Profile created successfully");
        }
      }
    }
  } else {
    console.log("[OAuth Callback] No code provided - this might be a direct access");
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
    console.log("[OAuth Callback] Using next path:", redirectUrl);
  } else {
    // Если nextPath не передан, проверяем есть ли параметр referer
    // Из страницы откуда пришл от OAuth
    const referer = request.headers.get("referer");
    console.log("[OAuth Callback] Referer:", referer);
    
    if (referer) {
      const refererUrl = new URL(referer);
      const refererPath = refererUrl.pathname;

      // Если referer - это страница login/register, редиректируем на главную
      const authPaths = ["/login", "/register"];
      const isAuthPage = authPaths.some(
        (path) => refererPath === path || refererPath.startsWith(`${path}/`)
      );

      redirectUrl = isAuthPage ? "/" : refererPath;
      console.log("[OAuth Callback] Using referer path:", redirectUrl);
    } else {
      redirectUrl = "/";
      console.log("[OAuth Callback] Using default path: /");
    }
  }

  console.log("[OAuth Callback] Final redirect URL:", redirectUrl);

  // Создаем response с редиректом
  const response = NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));

  for (const { name, value, options } of cookiesToApply) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  }

  console.log("[OAuth Callback] Response status:", response.status);
  console.log("[OAuth Callback] Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

  // Устанавливаем cookies в response
  // В Next.js 16 cookies устанавливаются через request.cookies.set()
  // Но нужно убедиться, что они будут отправлены в браузер
  // Используем set-cookie header напрямую
  console.log("[OAuth Callback] Getting session...");
  const session = await supabase.auth.getSession();
  console.log("[OAuth Callback] Session result:", session.data.session ? "success" : "no session");
  if (session.data.session) {
    console.log("[OAuth Callback] Session user:", session.data.session.user.email);
  }

  console.log("=== OAUTH CALLBACK END ===");

  return response;
}
