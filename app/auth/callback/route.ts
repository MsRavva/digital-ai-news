import { randomBytes } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  buildOAuthDebugLoginPath,
  isOAuthDebugProvider,
  OAUTH_DEBUG_QUERY_FLAG,
  OAUTH_DEBUG_QUERY_FLOW,
  OAUTH_DEBUG_QUERY_PROVIDER,
} from "@/lib/oauth-debug";
import { getSafePostAuthRedirect } from "@/lib/oauth-redirect";
import {
  clearPostAuthRedirectCookie,
  getPostAuthRedirectFromRequest,
} from "@/lib/post-auth-redirect";

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
  const oauthDebugEnabled = requestUrl.searchParams.get(OAUTH_DEBUG_QUERY_FLAG) === "1";
  const oauthDebugFlowId = requestUrl.searchParams.get(OAUTH_DEBUG_QUERY_FLOW);
  const oauthDebugProviderValue = requestUrl.searchParams.get(OAUTH_DEBUG_QUERY_PROVIDER);
  const oauthDebugProvider = isOAuthDebugProvider(oauthDebugProviderValue)
    ? oauthDebugProviderValue
    : null;
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
    clearPostAuthRedirectCookie(response);
    return response;
  };

  const createOAuthDebugResponse = ({
    status,
    step,
    redirectTo,
    message,
  }: {
    status: "success" | "error";
    step: "callback_reached" | "code_exchanged" | "profile_checked" | "final_redirect_ready";
    redirectTo?: string | null;
    message?: string;
  }) => {
    if (!oauthDebugEnabled || !oauthDebugFlowId || !oauthDebugProvider) {
      return null;
    }

    return createRedirectResponse(
      buildOAuthDebugLoginPath({
        flowId: oauthDebugFlowId,
        provider: oauthDebugProvider,
        redirectTo,
        status,
        step,
        message,
      })
    );
  };

  const createPostLoginRedirectResponse = (redirect?: string | null) => {
    const postLoginUrl = new URL("/auth/post-login", requestUrl.origin);

    if (redirect) {
      postLoginUrl.searchParams.set("redirect", redirect);
    }

    const response = NextResponse.redirect(postLoginUrl);

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
      const debugResponse = createOAuthDebugResponse({
        status: "error",
        step: "code_exchanged",
        redirectTo:
          getSafePostAuthRedirect(requestUrl.searchParams.get("next")) ||
          getPostAuthRedirectFromRequest(request),
        message: error.message,
      });

      if (debugResponse) {
        return debugResponse;
      }

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

          const debugResponse = createOAuthDebugResponse({
            status: "error",
            step: "profile_checked",
            redirectTo:
              getSafePostAuthRedirect(requestUrl.searchParams.get("next")) ||
              getPostAuthRedirectFromRequest(request),
            message: "Не удалось подготовить профиль пользователя",
          });

          if (debugResponse) {
            return debugResponse;
          }

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
  } else {
    const callbackError =
      requestUrl.searchParams.get("error_description") ||
      requestUrl.searchParams.get("error") ||
      "OAuth callback пришел без code";

    const debugResponse = createOAuthDebugResponse({
      status: "error",
      step: "callback_reached",
      redirectTo:
        getSafePostAuthRedirect(requestUrl.searchParams.get("next")) ||
        getPostAuthRedirectFromRequest(request),
      message: callbackError,
    });

    if (debugResponse) {
      return debugResponse;
    }
  }

  const nextRedirect = getSafePostAuthRedirect(requestUrl.searchParams.get("next"));
  const fallbackRedirect = getPostAuthRedirectFromRequest(request);
  const redirectTo = nextRedirect || fallbackRedirect;

  const debugSuccessResponse = createOAuthDebugResponse({
    status: "success",
    step: "final_redirect_ready",
    redirectTo,
    message: "Callback обработан, последний чек получен.",
  });

  if (debugSuccessResponse) {
    return debugSuccessResponse;
  }

  const response = createPostLoginRedirectResponse(redirectTo);
  clearPostAuthRedirectCookie(response);
  return response;
}
