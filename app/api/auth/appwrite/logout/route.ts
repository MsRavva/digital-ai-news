import { NextResponse } from "next/server";
import { clearAppwriteSessionCookie, deleteCurrentAppwriteSession } from "@/lib/appwrite/auth";

export async function POST() {
  try {
    await deleteCurrentAppwriteSession();
    await clearAppwriteSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Appwrite logout error:", error);
    await clearAppwriteSessionCookie();
    return NextResponse.json({ success: true });
  }
}
