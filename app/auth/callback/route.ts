import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getReturnUrl, clearReturnUrl } from "@/lib/auth-helpers"

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
    }
  }

  const redirectUrl = getReturnUrl() || "/"
  clearReturnUrl()

  return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
}
