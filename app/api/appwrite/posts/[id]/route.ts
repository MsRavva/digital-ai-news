import { NextResponse } from "next/server";
import { getAppwritePostById } from "@/lib/appwrite/read";
import { requireSupabaseUser } from "@/lib/appwrite/route-guards";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireSupabaseUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const post = await getAppwritePostById(id);

    if (!post) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error loading Appwrite post:", error);
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}
