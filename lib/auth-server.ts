import { cookies } from "next/headers"
import { redirect } from "next/navigation"

/**
 * Базовая валидация JWT токена Firebase
 * Firebase ID токены имеют формат: header.payload.signature (3 части, разделенные точками)
 */
function isValidJWTFormat(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false
  }

  // JWT должен состоять из 3 частей, разделенных точками
  const parts = token.split(".")
  if (parts.length !== 3) {
    return false
  }

  // Каждая часть должна быть непустой
  if (parts.some((part) => !part || part.length === 0)) {
    return false
  }

  // Базовая проверка, что это base64url (может содержать A-Z, a-z, 0-9, -, _)
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/
  if (!parts.every((part) => base64UrlRegex.test(part))) {
    return false
  }

  return true
}

/**
 * Проверка аутентификации на сервере
 * Проверяет наличие и валидность формата JWT токена в cookie
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")?.value

    if (!authToken) {
      return false
    }

    // Проверяем формат JWT токена
    return isValidJWTFormat(authToken)
  } catch (error) {
    console.error("Error checking auth:", error)
    return false
  }
}

/**
 * Редирект если не авторизован
 * Используется для защищенных страниц (профиль, создание поста и т.д.)
 */
export async function requireAuth(redirectTo = "/login"): Promise<void> {
  const isAuthenticated = await checkAuth()
  if (!isAuthenticated) {
    redirect(redirectTo)
  }
}

/**
 * Редирект если авторизован (для страниц login/register)
 * Перенаправляет авторизованных пользователей на главную страницу
 */
export async function requireGuest(redirectTo = "/"): Promise<void> {
  const isAuthenticated = await checkAuth()
  if (isAuthenticated) {
    redirect(redirectTo)
  }
}

