import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { OAUTH_AUDIT_QUERY_SOURCE, recordOAuthAuditEvent } from "@/lib/oauth-audit";
import {
  buildOAuthDebugLoginPath,
  isOAuthDebugProvider,
  OAUTH_DEBUG_QUERY_FLAG,
  OAUTH_DEBUG_QUERY_FLOW,
  OAUTH_DEBUG_QUERY_PROVIDER,
} from "@/lib/oauth-debug";
import { ensureOAuthProfile } from "@/lib/oauth-profile";
import { getSafePostAuthRedirect } from "@/lib/oauth-redirect";
import {
  clearPostAuthRedirectCookie,
  getPostAuthRedirectFromRequest,
} from "@/lib/post-auth-redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthDebugEnabled = requestUrl.searchParams.get(OAUTH_DEBUG_QUERY_FLAG) === "1";
  const oauthDebugFlowId = requestUrl.searchParams.get(OAUTH_DEBUG_QUERY_FLOW);
  const oauthDebugProviderValue = requestUrl.searchParams.get(OAUTH_DEBUG_QUERY_PROVIDER);
  const oauthDebugProvider = isOAuthDebugProvider(oauthDebugProviderValue)
    ? oauthDebugProviderValue
    : null;
  const oauthAuditSourceValue = requestUrl.searchParams.get(OAUTH_AUDIT_QUERY_SOURCE);
  const oauthAuditSource =
    oauthAuditSourceValue === "login" || oauthAuditSourceValue === "register"
      ? oauthAuditSourceValue
      : "unknown";
  let successfulUserId: string | null = null;
  let successfulProfileDiagnostics: string[] = [];
  let successfulProfileMessage: string | null = null;
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
    stepDetails,
    diagnostics,
  }: {
    status: "success" | "error";
    step: "callback_reached" | "code_exchanged" | "profile_checked" | "final_redirect_ready";
    redirectTo?: string | null;
    message?: string;
    stepDetails?: Partial<
      Record<
        "callback_reached" | "code_exchanged" | "profile_checked" | "final_redirect_ready",
        string
      >
    >;
    diagnostics?: string[];
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
        stepDetails,
        diagnostics,
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

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent");
  const auditFlowId = oauthDebugFlowId;
  const auditProvider = oauthDebugProvider;
  const auditRedirectTo =
    getSafePostAuthRedirect(requestUrl.searchParams.get("next")) ||
    getPostAuthRedirectFromRequest(request);

  const recordAudit = async ({
    step,
    status,
    message,
    diagnostics,
    stepDetails,
    userId,
    username,
  }: {
    step: string;
    status: "running" | "success" | "error";
    message?: string;
    diagnostics?: string[];
    stepDetails?: Record<string, string>;
    userId?: string | null;
    username?: string | null;
  }) => {
    if (!auditFlowId || !auditProvider) {
      return;
    }

    await recordOAuthAuditEvent({
      flowId: auditFlowId,
      provider: auditProvider,
      source: oauthAuditSource,
      sourcePath: oauthAuditSource === "register" ? "/register" : "/login",
      redirectTo: auditRedirectTo,
      step,
      status,
      message,
      diagnostics,
      stepDetails,
      userId,
      username,
      ipAddress,
      userAgent,
    });
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
    await recordAudit({
      step: "callback_reached",
      status: "running",
      message: "OAuth callback достиг приложения.",
      diagnostics: ["[callback] callback route получил code от провайдера"],
      stepDetails: {
        callback_reached: "Callback приложения достигнут, начинаем обмен code на session.",
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      await recordAudit({
        step: "code_exchanged",
        status: "error",
        message: error.message,
        diagnostics: [
          "[callback] code получен, но exchangeCodeForSession завершился ошибкой",
          `[callback] ${error.code || "no_code"} ${error.message}`,
        ],
        stepDetails: {
          callback_reached: "Callback приложения достигнут, начинаем обмен code на session.",
          code_exchanged: `Ошибка обмена code на session: ${error.message}`,
        },
      });

      const debugResponse = createOAuthDebugResponse({
        status: "error",
        step: "code_exchanged",
        redirectTo:
          getSafePostAuthRedirect(requestUrl.searchParams.get("next")) ||
          getPostAuthRedirectFromRequest(request),
        message: error.message,
        stepDetails: {
          callback_reached: "Callback приложения достигнут, начинаем обмен code на session.",
          code_exchanged: `Ошибка обмена code на session: ${error.message}`,
        },
        diagnostics: [
          `[callback] code получен, но exchangeCodeForSession завершился ошибкой`,
          `[callback] ${error.code || "no_code"} ${error.message}`,
        ],
      });

      if (debugResponse) {
        return debugResponse;
      }

      return createRedirectResponse(
        `/login?error=auth_failed&details=${encodeURIComponent(error.message)}`
      );
    }

    if (data.session && data.user) {
      successfulUserId = data.user.id;
      await recordAudit({
        step: "code_exchanged",
        status: "running",
        message: `Code exchange выполнен для user.id=${data.user.id}.`,
        diagnostics: [`[callback] code exchange успешен, user.id=${data.user.id}`],
        stepDetails: {
          callback_reached: "Callback приложения достигнут.",
          code_exchanged: `Code exchange выполнен, session получена для user.id=${data.user.id}.`,
        },
        userId: data.user.id,
      });

      const profileResult = await ensureOAuthProfile(supabase, data.user);

      if (!profileResult.ok) {
        console.error("[OAuth Callback] Failed to ensure profile:", profileResult.diagnostics);
        await recordAudit({
          step: "profile_checked",
          status: "error",
          message: "Не удалось подтвердить профиль пользователя в Supabase",
          diagnostics: [
            `[callback] code exchange успешен, user.id=${data.user.id}`,
            ...profileResult.diagnostics,
          ],
          stepDetails: {
            callback_reached: "Callback приложения достигнут.",
            code_exchanged: `Code exchange выполнен, session получена для user.id=${data.user.id}.`,
            profile_checked: "Проверка или создание профиля завершились ошибкой.",
          },
          userId: data.user.id,
        });

        const debugResponse = createOAuthDebugResponse({
          status: "error",
          step: "profile_checked",
          redirectTo:
            getSafePostAuthRedirect(requestUrl.searchParams.get("next")) ||
            getPostAuthRedirectFromRequest(request),
          message: "Не удалось подтвердить профиль пользователя в Supabase",
          stepDetails: {
            callback_reached: "Callback приложения достигнут.",
            code_exchanged: `Code exchange выполнен, session получена для user.id=${data.user.id}.`,
            profile_checked: "Проверка или создание профиля завершились ошибкой.",
          },
          diagnostics: [
            `[callback] code exchange успешен, user.id=${data.user.id}`,
            ...profileResult.diagnostics,
          ],
        });

        if (debugResponse) {
          return debugResponse;
        }

        return createRedirectResponse("/login?error=profile_creation_failed");
      }

      successfulProfileDiagnostics = profileResult.diagnostics;
      successfulProfileMessage = profileResult.profile
        ? `Профиль подтвержден: ${profileResult.outcome}, username="${profileResult.profile.username}".`
        : `Профиль подтвержден: ${profileResult.outcome}.`;

      await recordAudit({
        step: "final_redirect_ready",
        status: "success",
        message: "OAuth callback успешно завершен, готовим финальный редирект.",
        diagnostics: [
          `[callback] code exchange успешен, user.id=${data.user.id}`,
          ...successfulProfileDiagnostics,
        ],
        stepDetails: {
          callback_reached: "Callback приложения достигнут.",
          code_exchanged: `Code exchange выполнен, session получена для user.id=${data.user.id}.`,
          profile_checked:
            successfulProfileMessage || "Профиль пользователя подтвержден в Supabase.",
          final_redirect_ready:
            "Последний серверный чек пройден, можно выполнять финальный редирект.",
        },
        userId: data.user.id,
        username: profileResult.profile?.username || null,
      });
    }
  } else {
    const callbackError =
      requestUrl.searchParams.get("error_description") ||
      requestUrl.searchParams.get("error") ||
      "OAuth callback пришел без code";

    await recordAudit({
      step: "callback_reached",
      status: "error",
      message: callbackError,
      diagnostics: [`[callback] OAuth callback пришел без валидного code: ${callbackError}`],
      stepDetails: {
        callback_reached: callbackError,
      },
    });

    const debugResponse = createOAuthDebugResponse({
      status: "error",
      step: "callback_reached",
      redirectTo:
        getSafePostAuthRedirect(requestUrl.searchParams.get("next")) ||
        getPostAuthRedirectFromRequest(request),
      message: callbackError,
      stepDetails: {
        callback_reached: callbackError,
      },
      diagnostics: [`[callback] OAuth callback пришел без валидного code: ${callbackError}`],
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
    stepDetails: successfulUserId
      ? {
          callback_reached: "Callback приложения достигнут.",
          code_exchanged: `Code exchange выполнен, session получена для user.id=${successfulUserId}.`,
          profile_checked:
            successfulProfileMessage || "Профиль пользователя подтвержден в Supabase.",
          final_redirect_ready:
            "Последний серверный чек пройден, можно выполнять финальный редирект.",
        }
      : undefined,
    diagnostics: successfulUserId
      ? [
          `[callback] code exchange успешен, user.id=${successfulUserId}`,
          ...successfulProfileDiagnostics,
        ]
      : undefined,
  });

  if (debugSuccessResponse) {
    return debugSuccessResponse;
  }

  const response = createPostLoginRedirectResponse(redirectTo);
  clearPostAuthRedirectCookie(response);
  return response;
}
