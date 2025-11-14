import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Защищенные маршруты (требуют авторизации)
const protectedRoutes = ["/", "/archive", "/create", "/edit", "/profile", "/admin", "/posts"]

// Публичные маршруты (не требуют авторизации)
const guestRoutes = ["/login", "/register"]

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Пропускаем API routes и статические файлы
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next()
  }

  // Создаем Supabase клиент для проверки сессии
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Проверяем сессию пользователя
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  // Проверяем, является ли маршрут защищенным
  const isRootRoute = pathname === "/" || pathname === ""
  const isOtherProtectedRoute = protectedRoutes
    .filter(route => route !== "/")
    .some(route => pathname.startsWith(route))
  
  const isProtectedRoute = isRootRoute || isOtherProtectedRoute

  // Проверяем, является ли маршрут guest маршрутом
  const isGuestRoute = guestRoutes.some((route) => pathname.startsWith(route))

  // Если пользователь пытается зайти на защищенный маршрут без авторизации
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Редирект авторизованных пользователей с guest routes на главную
  if (isGuestRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Разрешаем доступ к guest routes для неавторизованных пользователей
  if (isGuestRoute) {
    return response
  }

  return response
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
}
