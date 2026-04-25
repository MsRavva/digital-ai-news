import { type NextRequest, NextResponse } from "next/server";
import { getAppwritePosts } from "@/lib/appwrite/read";
import { requireSupabaseUser } from "@/lib/appwrite/route-guards";

export async function GET(request: NextRequest) {
  const auth = await requireSupabaseUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const includeArchived = searchParams.get("includeArchived") === "true";
    const archivedOnly = searchParams.get("archivedOnly") === "true";

    const posts = await getAppwritePosts(category, includeArchived, archivedOnly);
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error loading Appwrite posts:", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}
