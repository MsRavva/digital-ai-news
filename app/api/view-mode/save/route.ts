import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const VIEW_MODE_COOKIE_NAME = "view-mode";
const VIEW_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

export async function POST(request: Request) {
  try {
    const { viewMode } = await request.json();

    if (!viewMode || (viewMode !== "table" && viewMode !== "bento")) {
      return NextResponse.json({ error: "Invalid viewMode" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set(VIEW_MODE_COOKIE_NAME, viewMode, {
      maxAge: VIEW_MODE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: false, // Нужно для доступа с клиента
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving viewMode:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
