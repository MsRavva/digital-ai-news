import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = await cookies()
    
    // Создаем серверный Supabase клиент с cookie support
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Игнорируем ошибки cookie в middleware
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Error exchanging code for session:", error.message, error)
      return NextResponse.redirect(new URL(`/login?error=auth_failed&details=${encodeURIComponent(error.message)}`, requestUrl.origin))
    }

    if (data.session && data.user) {
      console.log("Session created successfully for user:", data.user.email)
      
      // Даем время на создание профиля через trigger
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Проверяем профиль пользователя
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.error("Error fetching profile:", profileError)
        // Профиль не найден - редирект на профиль для создания
        return NextResponse.redirect(new URL("/profile?update=username", requestUrl.origin))
      }
      
      if (profileData) {
        // Проверяем имя пользователя (должно быть "Имя Фамилия" на русском)
        const usernameRegex = /^[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+(\s+[А-ЯЁ][а-яё]+)*$/
        const hasValidUsername = usernameRegex.test(profileData.username)
        const hasEmail = profileData.email && profileData.email.trim() !== ""
        
        if (!hasValidUsername || !hasEmail) {
          // Редирект на профиль для обновления данных
          return NextResponse.redirect(new URL("/profile?update=username", requestUrl.origin))
        }
      }
    }
  }

  // Redirect to home page after successful authentication
  return NextResponse.redirect(new URL("/", requestUrl.origin))
}
