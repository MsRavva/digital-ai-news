import { NextResponse } from "next/server";
import {
  ensureAppwriteProfileForCurrentUser,
  getAppwriteCurrentUser,
  getAppwriteProfile,
} from "@/lib/appwrite/auth";

export async function GET() {
  try {
    const user = await getAppwriteCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null, profile: null }, { status: 200 });
    }

    let profile = await getAppwriteProfile(user.id);

    if (!profile) {
      try {
        profile = await ensureAppwriteProfileForCurrentUser();
      } catch (profileError) {
        console.error("Appwrite profile ensure error:", profileError);
        profile = await getAppwriteProfile(user.id);
      }
    }

    return NextResponse.json({ user, profile });
  } catch (error) {
    console.error("Appwrite me endpoint error:", error);
    return NextResponse.json(
      { error: { message: "Не удалось получить текущего пользователя" } },
      { status: 500 }
    );
  }
}
