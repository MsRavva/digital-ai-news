import { NextResponse } from "next/server";
import { updateAppwriteProfile, updateAppwriteUserPreferences } from "@/lib/appwrite/auth";
import { getAppwriteUserPreference } from "@/lib/appwrite/read";
import { requireSupabaseUser } from "@/lib/appwrite/route-guards";

export async function PATCH(request: Request) {
  const auth = await requireSupabaseUser();
  if (auth.response || !auth.user) {
    return auth.response || NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      profileData?: Record<string, unknown>;
      preferences?: {
        preferredCategory?: string;
        preferredViewMode?: "table" | "bento";
        themePreference?: "light" | "dark" | "system";
      };
    };

    if (payload.profileData) {
      const result = await updateAppwriteProfile(auth.user.id, payload.profileData);
      return NextResponse.json(result);
    }

    if (payload.preferences) {
      const success = await updateAppwriteUserPreferences(auth.user.id, payload.preferences);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ success: false }, { status: 400 });
  } catch (error) {
    console.error("Appwrite profile update error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = await requireSupabaseUser();
  if (auth.response || !auth.user) {
    return auth.response || NextResponse.json({ value: null }, { status: 401 });
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (key !== "preferredCategory" && key !== "preferredViewMode" && key !== "themePreference") {
    return NextResponse.json({ value: null }, { status: 400 });
  }

  const value = await getAppwriteUserPreference(auth.user.id, key);
  return NextResponse.json({ value });
}
