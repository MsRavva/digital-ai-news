import { NextResponse } from "next/server";
import { getAppwriteCommentsByPostId } from "@/lib/appwrite/read";
import { requireSupabaseUser } from "@/lib/appwrite/route-guards";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireSupabaseUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const comments = await getAppwriteCommentsByPostId(id);
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error loading Appwrite comments:", error);
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}
