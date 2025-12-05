import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const THEME_COOKIE_NAME = "theme";
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

export async function POST(request: Request) {
  try {
    const { theme } = await request.json();

    if (!theme || (theme !== "light" && theme !== "dark" && theme !== "system")) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set(THEME_COOKIE_NAME, theme, {
      maxAge: THEME_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: false, // Нужно для доступа с клиента
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving theme:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
