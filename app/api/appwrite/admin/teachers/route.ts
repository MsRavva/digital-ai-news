import { NextResponse } from "next/server";
import { getAppwriteTeachers } from "@/lib/appwrite/read";
import { requireAdminOrTeacher } from "@/lib/appwrite/route-guards";

export async function GET() {
  const auth = await requireAdminOrTeacher();
  if (auth.response) {
    return auth.response;
  }

  try {
    const teachers = await getAppwriteTeachers();
    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Error loading Appwrite teachers:", error);
    return NextResponse.json({ error: "Failed to load teachers" }, { status: 500 });
  }
}
