import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ensureOAuthProfile } from "@/lib/oauth-profile";
import { getSafePostAuthRedirect } from "@/lib/oauth-redirect";
import {
  clearPostAuthRedirectCookie,
  getPostAuthRedirectFromRequest,
} from "@/lib/post-auth-redirect";

export async function GET(request: NextRequest) {
  const formatAuthErrorMessage = (message: string) => {
    if (message.toLowerCase().includes("database error saving new user")) {
      return "Supabase не смог сохранить нового пользователя в базе. Вероятен конфликт профиля или ошибка trigger handle_new_user().";
    }

    return message;
  };

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
    clearPostAuthRedirectCookie(response);
    return response;
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
      return createRedirectResponse(
        `/login?error=auth_failed&details=${encodeURIComponent(formatAuthErrorMessage(error.message))}`
      );
    }

    if (data.session && data.user) {
      const profileResult = await ensureOAuthProfile(supabase, data.user);

      if (!profileResult.ok) {
        console.error("[OAuth Callback] Failed to ensure profile:", profileResult.diagnostics);
        return createRedirectResponse("/login?error=profile_creation_failed");
      }
    }
  } else {
    const callbackError = formatAuthErrorMessage(
      requestUrl.searchParams.get("error_description") ||
        requestUrl.searchParams.get("error") ||
        "OAuth callback пришел без code"
    );

    return createRedirectResponse(
      `/login?error=auth_failed&details=${encodeURIComponent(callbackError)}`
    );
  }

  const nextRedirect = getSafePostAuthRedirect(requestUrl.searchParams.get("next"));
  const fallbackRedirect = getPostAuthRedirectFromRequest(request);
  const redirectTo = nextRedirect || fallbackRedirect;

  const response = createPostLoginRedirectResponse(redirectTo);
  clearPostAuthRedirectCookie(response);
  return response;
}
