import type { NextRequest, NextResponse } from "next/server";
import { getSafePostAuthRedirect } from "./oauth-redirect";

export const POST_AUTH_REDIRECT_COOKIE = "post_auth_redirect";

export function buildPostAuthRedirect(pathname: string, search = ""): string | null {
  return getSafePostAuthRedirect(`${pathname}${search}`);
}

export function getPostAuthRedirectFromRequest(request: NextRequest): string | null {
  const redirectFromCookie = request.cookies.get(POST_AUTH_REDIRECT_COOKIE)?.value;
  if (redirectFromCookie) {
    const safeRedirect = getSafePostAuthRedirect(redirectFromCookie);
    if (safeRedirect) return safeRedirect;
  }

  return getSafePostAuthRedirect(request.nextUrl.searchParams.get("redirect"));
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
