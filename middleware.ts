import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  buildPostAuthRedirect,
  getPostAuthRedirectFromRequest,
  setPostAuthRedirectCookie,
} from "@/lib/post-auth-redirect";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

// Защищенные маршруты (требуют авторизации)
const protectedRoutes = ["/", "/archive", "/create", "/edit", "/profile", "/admin", "/posts"];

// Публичные маршруты (не требуют авторизации)
const guestRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

// Маршруты только для администраторов
const adminRoutes = ["/admin"];

// Маршруты которые не требуют проверки (OAuth callback, API)
const publicRoutes = ["/auth/callback", "/api"];

// Маршруты для rate limiting
const rateLimitedRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Пропускаем API routes, статические файлы и публичные маршруты
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/auth/callback" ||
    publicRoutes.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Rate limiting для auth страниц
  const isRateLimitedRoute = rateLimitedRoutes.some((route) => pathname.startsWith(route));
  if (isRateLimitedRoute && request.method === "POST") {
    const ip = getClientIP(request);
    const { allowed, retryAfter } = checkRateLimit(ip);

    if (!allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Content-Type": "text/plain",
        },
      });
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Проверяем сессию пользователя
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // Получаем профиль для проверки роли
  let userProfile = null;
  if (isAuthenticated && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    userProfile = profile;
  }

  // Проверяем, является ли маршрут защищенным
  const isRootRoute = pathname === "/" || pathname === "";
  const isOtherProtectedRoute = protectedRoutes
    .filter((route) => route !== "/")
    .some((route) => pathname.startsWith(route));

  const isProtectedRoute = isRootRoute || isOtherProtectedRoute;

  // Проверяем, является ли маршрут guest маршрутом
  const isGuestRoute = guestRoutes.some((route) => pathname.startsWith(route));

  // Если пользователь пытается зайти на защищенный маршрут без авторизации
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

  // Проверка доступа к admin маршрутам
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  if (isAdminRoute && isAuthenticated) {
    const userRole = userProfile?.role || "student";
    if (userRole !== "admin" && userRole !== "teacher") {
      // Редирект на главную для пользователей без прав
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Редирект авторизованных пользователей с guest routes
  // Исключение: /reset-password - разрешаем доступ для восстановления пароля
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

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
