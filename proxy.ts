import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getAppwritePublicConfig, getAppwriteSessionCookieName } from "@/lib/appwrite/env";
import { getBackendProvider } from "@/lib/backend-provider";
import {
  buildPostAuthRedirect,
  getPostAuthRedirectFromRequest,
  setPostAuthRedirectCookie,
} from "@/lib/post-auth-redirect";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

const protectedRoutes = ["/", "/archive", "/create", "/edit", "/profile", "/admin", "/posts"];
const guestRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
const adminRoutes = ["/admin"];
const publicRoutes = ["/auth/callback", "/auth/post-login", "/api"];
const rateLimitedRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAppwrite = getBackendProvider() === "appwrite";

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/auth/callback" ||
    pathname === "/auth/post-login" ||
    publicRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  const isRateLimitedRoute = rateLimitedRoutes.some((route) => pathname.startsWith(route));
  if (isRateLimitedRoute && request.method === "POST") {
    const ip = getClientIP(request);
    const { allowed, retryAfter } = checkRateLimit(ip);

    if (!allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      });
    }
  }

  const isRootRoute = pathname === "/" || pathname === "";
  const isOtherProtectedRoute = protectedRoutes
    .filter((route) => route !== "/")
    .some((route) => pathname.startsWith(route));
  const isProtectedRoute = isRootRoute || isOtherProtectedRoute;
  const isGuestRoute = guestRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (isAppwrite) {
    const appwriteConfig = getAppwritePublicConfig();
    const sessionCookieName = appwriteConfig
      ? getAppwriteSessionCookieName(appwriteConfig.projectId)
      : null;
    const isAuthenticated = sessionCookieName
      ? Boolean(request.cookies.get(sessionCookieName)?.value)
      : false;

    if (isProtectedRoute && !isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      const redirectTarget = buildPostAuthRedirect(pathname, request.nextUrl.search);

      if (redirectTarget) {
        loginUrl.searchParams.set("redirect", redirectTarget);
      }

      const redirectResponse = NextResponse.redirect(loginUrl);

      if (redirectTarget) {
        setPostAuthRedirectCookie(redirectResponse, redirectTarget);
      }

      return redirectResponse;
    }

    if (isGuestRoute && isAuthenticated && pathname !== "/reset-password") {
      const redirectTo = getPostAuthRedirectFromRequest(request);
      const postLoginUrl = new URL("/auth/post-login", request.url);

      if (redirectTo) {
        postLoginUrl.searchParams.set("redirect", redirectTo);
      }

      return NextResponse.redirect(postLoginUrl);
    }

    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    const redirectTarget = buildPostAuthRedirect(pathname, request.nextUrl.search);

    if (redirectTarget) {
      loginUrl.searchParams.set("redirect", redirectTarget);
    }

    const redirectResponse = NextResponse.redirect(loginUrl);

    if (redirectTarget) {
      setPostAuthRedirectCookie(redirectResponse, redirectTarget);
    }

    return redirectResponse;
  }

  if (isGuestRoute && user && pathname !== "/reset-password") {
    const redirectTo = getPostAuthRedirectFromRequest(request);
    const postLoginUrl = new URL("/auth/post-login", request.url);

    if (redirectTo) {
      postLoginUrl.searchParams.set("redirect", redirectTo);
    }

    return NextResponse.redirect(postLoginUrl);
  }

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin" && profile?.role !== "teacher") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
