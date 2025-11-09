import { NextRequest, NextResponse } from "next/server"

/**
 * API route для установки auth-token cookie с httpOnly флагом
 * Это более безопасный способ установки cookie, чем через document.cookie
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 },
      )
    }

    // Проверяем формат JWT (базовая валидация)
    const parts = token.split(".")
    if (parts.length !== 3) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 },
      )
    }

    // Устанавливаем cookie с httpOnly флагом для безопасности
    const response = NextResponse.json({ success: true })
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 час (Firebase токены живут 1 час)
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error setting auth token:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

/**
 * DELETE endpoint для удаления auth-token cookie
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  // Удаляем cookie, устанавливая его с истекшим временем
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Немедленное истечение
    path: "/",
  })
  return response
}

