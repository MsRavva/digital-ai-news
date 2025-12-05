import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const CATEGORY_COOKIE_NAME = "selected-category";
const CATEGORY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

export async function POST(request: Request) {
  try {
    const { category } = await request.json();

    if (!category || typeof category !== "string") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set(CATEGORY_COOKIE_NAME, category, {
      maxAge: CATEGORY_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: false, // Нужно для доступа с клиента
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
