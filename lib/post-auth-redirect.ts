import type { NextRequest, NextResponse } from "next/server";
import { getSafePostAuthRedirect } from "./oauth-redirect";

export const POST_AUTH_REDIRECT_COOKIE = "post_auth_redirect";

export function buildPostAuthRedirect(pathname: string, search = ""): string | null {
  return getSafePostAuthRedirect(`${pathname}${search}`);
}

export function resolvePostAuthRedirect(
  redirectFromCookie?: string | null,
  redirectFromQuery?: string | null
): string | null {
  const safeCookieRedirect = getSafePostAuthRedirect(redirectFromCookie);
  if (safeCookieRedirect) return safeCookieRedirect;

  return getSafePostAuthRedirect(redirectFromQuery);
}

export function getPostAuthRedirectFromRequest(request: NextRequest): string | null {
  return resolvePostAuthRedirect(
    request.cookies.get(POST_AUTH_REDIRECT_COOKIE)?.value,
    request.nextUrl.searchParams.get("redirect")
  );
}

export function buildPostLoginRedirectPath(
  searchParams: URLSearchParams | null,
  fallback = "/"
): string {
  const params = new URLSearchParams(searchParams?.toString());
  const redirect = getSafePostAuthRedirect(params.get("redirect")) || fallback;

  if (redirect !== "/") {
    params.set("redirect", redirect);
  } else {
    params.delete("redirect");
  }

  const query = params.toString();
  return query ? `/auth/post-login?${query}` : "/auth/post-login";
}

export function setPostAuthRedirectCookie(response: NextResponse, redirect: string): void {
  response.cookies.set(POST_AUTH_REDIRECT_COOKIE, redirect, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export function clearPostAuthRedirectCookie(response: NextResponse): void {
  response.cookies.set(POST_AUTH_REDIRECT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
