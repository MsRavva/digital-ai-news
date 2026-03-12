import { redirect } from "next/navigation";
import { buildPostAuthRedirect } from "./post-auth-redirect";
import { createServerSupabaseClient } from "./supabase-server";

/**
 * Проверка аутентификации на сервере
 * Проверяет наличие и валидность Supabase сессии
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return !!user;
  } catch (error) {
    console.error("Error checking auth:", error);
    return false;
  }
}

/**
 * Редирект если не авторизован
 * Используется для защищенных страниц (профиль, создание поста и т.д.)
 */
export async function requireAuth(currentPath?: string, search = ""): Promise<void> {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    const loginUrl = new URL("http://localhost/login");
    const redirectTarget = currentPath ? buildPostAuthRedirect(currentPath, search) : null;

    if (redirectTarget) {
      loginUrl.searchParams.set("redirect", redirectTarget);
    }

    redirect(`${loginUrl.pathname}${loginUrl.search}`);
  }
}

/**
 * Редирект если авторизован (для страниц login/register)
 * Перенаправляет авторизованных пользователей на главную страницу
 */
export async function requireGuest(redirectTo = "/"): Promise<void> {
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) {
    redirect(redirectTo);
  }
}
