import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/lib/appwrite/route-guards";
import { createAppwritePost } from "@/lib/appwrite/write";

export async function POST(request: Request) {
  const auth = await requireSupabaseUser();
  if (auth.response) {
    return auth.response;
  }

  try {
    const payload = (await request.json()) as {
      title: string;
      content: string;
      category: string;
      author_id: string;
      tags: string[];
      source_url?: string;
    };

    const postId = await createAppwritePost(payload);
    return NextResponse.json({ postId });
  } catch (error) {
    console.error("Appwrite post create error:", error);
    return NextResponse.json({ postId: null }, { status: 500 });
  }
}
